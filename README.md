# Smart Food Analyzer

Smart Food Analyzer is an AI-powered system that analyzes food images
to identify food items, segment food regions, and estimate portion sizes,
with a focus on Pakistani cuisine.

## Sprint 1 Features
- Food image classification using MobileNet and Yolov8
- Food segmentation using YOLOv8-Seg
- Model inference on sample food images
- Portion estimation pipeline (in progress)

## Technologies Used
- Python
- PyTorch
- YOLOv8 (Ultralytics)
- OpenCV
- NumPy
- Colab Notebook

## Project Structure
- notebooks/ : Model training and inference notebooks
- models/ : Trained ML models
- src/ : Core source code
- docs/ : D2 documentation and screenshots

## Setup Instructions
```bash
git https://github.com/foodanalyzer/SmartFoodAnalyzer.git
cd smartfoodanalyzer
pip install -r requirements.txt

