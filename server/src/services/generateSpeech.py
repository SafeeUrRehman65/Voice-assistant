# example.py
import os
from dotenv import load_dotenv
from typing import IO
from io import BytesIO
from murf import Murf
import requests
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from fastapi import FastAPI, File, UploadFile, HTTPException

load_dotenv()

# elevenlabs = ElevenLabs(
#   api_key=os.getenv("ELEVENLABS_API_KEY"),
# )

# def text_to_speech_stream(text: str) -> IO[bytes]:
#     # Perform the text-to-speech conversion
#     response = elevenlabs.text_to_speech.stream(
#         voice_id="pNInz6obpgDQGcFmaJgB", # Adam pre-made voice
#         output_format="mp3_22050_32",
#         text=text,
#         model_id="eleven_multilingual_v2",
#         # Optional voice settings that allow you to customize the output
#         voice_settings=VoiceSettings(
#             stability=0.0,
#             similarity_boost=1.0,
#             style=0.0,
#             use_speaker_boost=True,
#             speed=1.0,
#         ),
#     )
#     # Create a BytesIO object to hold the audio data in memory
#     audio_stream = BytesIO()
#     # Write each chunk of audio data to the stream
#     for chunk in response:
#         if chunk:
#             audio_stream.write(chunk)
#     # Reset stream position to the beginning
#     audio_stream.seek(0)
#     # Return the stream for further use
#     return audio_stream




client = Murf(api_key=os.getenv("MURF_AI_API_KEY"))

def text_to_speech(text: str):
    response = client.text_to_speech.generate(
    text = text,
    voice_id = "en-US-ken",
    style = "Conversational",
    pitch = 10
    )


    return response.audio_file



