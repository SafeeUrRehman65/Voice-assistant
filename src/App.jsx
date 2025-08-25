import { useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { FaMicrophone } from "react-icons/fa";
import SplineChips from './components/spline-chips'
import SplineGalaxy from './components/spline-galaxy';



function App() {

  const mediaRecorderRef = useRef()
  const audioChunkRefs = useRef([])
  const audioRef = useRef()
  const [audioblob, setAudioBlob] = useState()
  const [audioURL, setAudioURL] = useState()



  const startRecording = async () => {
    try {
      audioChunkRefs.current = []
      const stream = await navigator.mediaDevices.getUserMedia(
        {
          audio: true,
        })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      console.log(mediaRecorder.state)
      console.log("Recorder started")

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunkRefs.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunkRefs.current, { type: 'audio/wav' })

        const audioURL = URL.createObjectURL(audioBlob)

        setAudioBlob(audioBlob)
        setAudioURL(audioURL)
        audioRef.current.src = audioURL
      }
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Microphone access denied or not available")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      console.log("Stopping audio")
      mediaRecorderRef.current.stop()
      console.log(mediaRecorderRef.current.state)
      console.log("Recorder stopped")
    }

  }

  return (
    <div className='w-screen h-screen bg-stars-back bg-cover '>
      <div className='h-[8vh] w-full'>

      </div>
      <div className='w-full h-[60%] shadow-2xl shadow-violet-500/20'>
        <SplineChips />
      </div>

      <div className='w-full pt-6 flex flex-col items-center justify-center'>
        <p className='text-center text-3xl inter-300 text-zinc-300'>How may I help you today?</p>
      </div>

      <div className='w-full h-1/6 flex justify-center items-center'>
        <div onClick={startRecording} className='bg-white bg-zinc-200 flex items-center cursor-pointer justify-center rounded-full w-16 h-16 hover:bg-gray-300'>
          <FaMicrophone className='w-6 h-6 text-neutral-900' />
        </div>
      </div>
      <div className='stop-button flex w-screen justify-center'>
        <div onClick={stopRecording} className='w-10 h-10 rounded-full bg-red-300 cursor-pointer'></div>
      </div>
      <div className='w-full h-max flex justify-center items-center py-4'>
        <audio
          className='w-64'
          ref={audioRef}
          id='recordedAudio'
          controls
        />
      </div>
    </div>
  )
}

export default App
