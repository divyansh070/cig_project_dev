import os
import google.generativeai as genai

# Ensure your API key is set in your environment variables:
os.environ["GEMINI_API_KEY"] = "AIzaSyADfJgymiqwMBMLLSPRaNVD6OGgy7GrE9Q"

def list_gemini_models():
    try:
        # Initialize the client (automatically picks up GEMINI_API_KEY from environment)
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        
        print("Fetching available Gemini models...\n")
        print(f"{'Model Name':<50}")
        print("-" * 80)
        
        # Loop through and display available models
        for model in genai.list_models():
            print(f"{model.name:<50}")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        print("Please check if your GEMINI_API_KEY environment variable is set correctly.")

if __name__ == "__main__":
    list_gemini_models()