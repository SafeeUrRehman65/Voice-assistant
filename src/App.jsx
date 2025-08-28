import { useState, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { FaMicrophone } from "react-icons/fa";
import SplineChips from "./components/spline-chips";
import SplineGalaxy from "./components/spline-galaxy";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import { settings } from "@elevenlabs/elevenlabs-js/api/resources/voices";

function App() {
  // define all possible states
  const STATES = {
    LISTENING: "listening",
    PROCESSING: "processing",
    SPEAKING: "speaking",
    SILENT: "silent",
  };
  const mediaRecorderRef = useRef();
  const audioChunkRefs = useRef([]);
  const audioRef = useRef();
  const baseLevelRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const voiceIntervalRef = useRef();
  const abortControllerRef = useRef(new AbortController());
  const greetingRef = useRef();
  const timerRefWord = useRef();
  const timerRefChar = useRef();
  const speechCounter = useRef(0);
  const [audioblob, setAudioBlob] = useState();
  const [isRecording, setisRecording] = useState(false);
  const [audioURL, setAudioURL] = useState();
  const [themeColor, setThemeColor] = useState();
  const animationRef = useRef();
  const analyserRef = useRef();
  const dataArrayRef = useRef();

  const [currentState, setCurrentState] = useState(STATES.LISTENING);

  const [greeting, setGreeting] = useState("How may I help you today?");
  const [isReponded, setIsResponded] = useState(false);

  const typeGreeting = () => {
    const words = greeting.split(" ");
    let currentwordIndex = 0;
    const greeting_length = words.length - 1;

    if (timerRefWord.current) {
      clearTimeout(timerRefWord.current);
    }
    const typeWords = () => {
      if (timerRefChar.current) {
        clearTimeout(timerRefChar.current);
      }
      if (currentwordIndex <= greeting_length) {
        const word = words[currentwordIndex];
        console.log("word", word);
        const word_length = words[currentwordIndex].length;
        console.log("word_length", word_length);
        let currentcharIndex = 0;
        const typeChar = () => {
          if (currentcharIndex < word_length) {
            const current_char = word[currentcharIndex];
            console.log("current_char", current_char);
            // greetingRef.current.innerText += current_char;

            // fade-in effect
            const span = document.createElement("span");
            span.innerText = current_char;
            span.style.opacity = 0;
            span.style.transition = "opacity 0.15s";
            greetingRef.current.appendChild(span);
            setTimeout(() => (span.style.opacity = 1), 10);

            currentcharIndex++;
            const delay = 30 + Math.random() * 30;
            timerRefChar.current = setTimeout(typeChar, delay);
          } else {
            currentwordIndex += 1;
            if (currentwordIndex <= greeting_length) {
              const span = document.createElement("span");
              span.innerText = " ";
              span.style.opacity = 0;
              span.style.transition = "opacity 0.15s";
              greetingRef.current.appendChild(span);
              setTimeout(() => (span.style.opacity = 1), 10);
            }
            // technique for typing smaller words faster and longer words slower
            timerRefWord.current = setTimeout(
              typeWords,
              word_length <= 5
                ? 50 + Math.random() * 50
                : 70 + Math.random() * 70
            );
          }
        };
        typeChar();
      }
    };

    greetingRef.current.innerText = "";
    typeWords();
  };

  const sendStream = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("http://localhost:3000/api/transcript", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();
      const response_data = data.response_data;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server error");
      }
      setIsResponded(true);
      // COMPLETELY reset the audio element
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";

      // Add CORS attribute to allow cross-origin audio
      audioRef.current.crossOrigin = "anonymous";

      const audio_url = response_data.audio_url;

      // Set the source to the remote URL
      audioRef.current.src = audio_url;

      // Wait for the audio to be ready to play
      audioRef.current.oncanplaythrough = async () => {
        console.log("Remote audio is ready to play");
        try {
          await audioRef.current.play();
          setCurrentState(STATES.SPEAKING);
          console.log("Remote audio playback started");
          audioRef.current.onended = () => {
            setCurrentState(STATES.LISTENING);
          };
        } catch (e) {
          console.error("Autoplay blocked by browser:", e);
          setCurrentState(STATES.LISTENING);
          // Show a play button for user to click
        }
      };

      // Handle any loading errors (common with CORS)
      audioRef.current.onerror = (e) => {
        console.error("Failed to load remote audio:", e);
        console.error(
          "This is likely a CORS issue. Check the audio URL's CORS headers."
        );
      };
    } catch (error) {
      console.log(
        "Network Error: Failed while sending request to server",
        error,
        error.error
      );
    }
  };

  const startRecording = async () => {
    try {
      audioChunkRefs.current = [];
      baseLevelRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("Recorder started");

      setisRecording(true);

      // creating analytics from the recorded stream
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);
      analyserRef.current = analyser;

      // voice activity detection
      const detectVoiceActivity = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (baseLevelRef.current === null) {
          baseLevelRef.current = average;
          console.log("Base noise level", baseLevelRef.current);
        }

        const offset = 15;
        const isSpeaking = average > baseLevelRef.current + offset;
        return isSpeaking;
      };

      voiceIntervalRef.current = setInterval(() => {
        const isSpeaking = detectVoiceActivity();

        if (isSpeaking) {
          speechCounter.current++;
          if (speechCounter.current > 2 && currentState !== STATES.LISTENING) {
            cancelCurrentOperation();
            setCurrentState(STATES.LISTENING);
            speechCounter.current = 0;
          }

          // reset silence timer while speaking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          speechCounter.current = 0;
          if (!silenceTimerRef.current && currentState === STATES.LISTENING) {
            silenceTimerRef.current = setTimeout(() => {
              console.log("Stopping audio after silence");
              mediaRecorderRef.current.stop();
              setisRecording(false);
              setCurrentState(STATES.PROCESSING);
            }, 1500); // 1.5s silence
          }
        }
      }, 200);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunkRefs.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setCurrentState(STATES.PROCESSING);
        const audioBlob = new Blob(audioChunkRefs.current, {
          type: "audio/wav",
        });

        // const audioURL = URL.createObjectURL(audioBlob);
        await sendStream(audioBlob);

        if (voiceIntervalRef.current) {
          clearInterval(voiceIntervalRef.current);
          voiceIntervalRef.current = null;
        }

        if (currentState != STATES.SPEAKING) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied or not available");
    }
  };

  // logic to stop recording if user is silent for 1.5s

  // const stopRecording = () => {
  //   if (silenceTimerRef.current) {
  //     clearTimeout(silenceTimerRef.current);
  //   }
  //   silenceTimerRef.current = setTimeout(() => {
  //     if (currentState === STATES.LISTENING) {
  //       console.log("Stopping audio");
  //       mediaRecorderRef.current.stop();
  //       setisRecording(false);
  //       setCurrentState(STATES.PROCESSING);
  //       console.log(mediaRecorderRef.current.state);

  //       console.log("Recorder stopped!");
  //     }
  //   }, 1500);
  // };

  // logic to stop or halt previous api requests if user starts again
  const cancelCurrentOperation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Clear voice detection interval
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state == "recording"
    ) {
      console.log(
        "Unexpected: MediaRecorder was still running during interruption"
      );
      mediaRecorderRef.current.stop();
    }
    startRecording();
  };

  useEffect(() => {
    if (greetingRef.current) {
      typeGreeting();
    }
    return () => {
      if (timerRefWord.current) {
        clearTimeout(timerRefWord.current);
      }
    };
  }, [greeting]);

  useEffect(() => {
    const initializeRecording = async () => {
      await startRecording();
      setCurrentState(STATES.LISTENING);
    };

    initializeRecording();

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (voiceIntervalRef.current) {
        clearInterval(voiceIntervalRef.current);
      }
    };
  }, []);
  return (
    <div className="w-screen h-screen bg-stars-back bg-cover ">
      <div className="h-[8vh] w-full"></div>
      <div className="w-full h-[60%] shadow-2xl shadow-violet-500/20">
        <SplineChips />
      </div>

      <div className="w-full pt-6 flex flex-col items-center justify-center">
        <p
          ref={greetingRef}
          className="text-center text-3xl inter-300 text-zinc-300 whitespace-pre"
        ></p>
      </div>

      <div className="w-full h-[10%]"></div>
      <audio ref={audioRef} controls></audio>
    </div>
  );
}

export default App;
