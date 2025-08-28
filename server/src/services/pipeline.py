import os
from transcribeAudio import transcribe
from generateResponse import generateResponse
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from fastapi import FastAPI, HTTPException, UploadFile, File
from generateSpeech import text_to_speech
from fastapi.responses import StreamingResponse, JSONResponse

app = FastAPI()
# Creating a pipeline here which chains three things together:
#     Transcription => Text_to_LLM => LLM_Response = > Text_to_Speech


elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)

# passing audio to function in audio/wav format
@app.post("/execute-pipeline")
async def pipeline(audio:UploadFile = File(...)):
    
    print(f"Audio received: {audio}")
    print(f"Filename: {audio.filename}")
    print(f"Content type: {audio.content_type}")
    
    transcription = transcribe()
    print(transcription)
    llm_response = generateResponse(transcription)
    print(llm_response)
    audio_url = text_to_speech(llm_response)
    
    if audio_url:
      
      response_data ={
        "success":True,
        "audio_url": audio_url,
        "transcription": transcription,
        "llm_response": llm_response,
        "message": "Pipeline executed successfully!"
      }     
    
    else:
        response_data ={
        "success":True,
        "audio_url": "",
        "transcription":"",
        "llm_response": "",
        "message": "Pipeline executed successfully!"
      }     
    print("Response data", response_data)
    return JSONResponse(content = response_data)
