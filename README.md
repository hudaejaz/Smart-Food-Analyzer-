# Smart Food Analyzer

Smart Food Analyzer is an AI-powered computer vision system that detects food items from images, estimates portion sizes, and calculates nutritional information such as calories, protein, carbohydrates, and fats. 

The project specifically focuses on **Pakistani cuisine**, aiming to simplify dietary tracking for healthcare, fitness, and nutrition applications by automating what is traditionally a manual and tedious process.

## Problem Statement

Manual calorie tracking is inefficient because users must:
* Identify food items manually
* Estimate portion sizes by eye
* Search for and enter nutritional values manually

This system automates the entire workflow using computer vision and deep learning.

## Objectives

* **Detect and Classify:** Identify food items from images.
* **Instance Segmentation:** Perform precise segmentation of food regions.
* **Portion Estimation:** Estimate portion size using depth estimation.
* **Nutritional Calculation:** Calculate values automatically based on weight.
* **Regional Support:** Specialized focus on Pakistani food categories.
* **Real-time Analysis:** Enable instant image-based feedback.

## Features

### Food Detection and Classification
Detects regional favorites such as Biryani, Karahi, Nihari, Chapati, Rice, Fruits, and Vegetables.

### Instance Segmentation
Uses **YOLOv8-Seg** for precise, pixel-level segmentation to distinguish between different food items on a single plate.

### Portion Size Estimation
Combines segmentation area and **MiDaS depth estimation** to convert visual data into an estimated weight in grams.

### Nutritional Analysis
Computes Calories, Protein, Carbohydrates, and Fats based on verified nutritional data (FoodWorks).

### Smart Camera Overlay
* Guides users for proper image capture.
* Displays alignment boxes for positioning.
* Indicates optimal distance with a green border.
* Restricts capture until conditions are correct to ensure accuracy.

## System Workflow

1. **Capture:** User captures food image via the camera interface.
2. **Validation:** Overlay ensures proper distance and alignment.
3. **Transmission:** Image is sent to the backend API.
4. **Detection:** YOLOv8-Seg detects and segments food items.
5. **Depth Mapping:** MiDaS estimates depth to calculate volume.
6. **Calculation:** Portion size and nutritional values are computed.
7. **Delivery:** Results are returned in a structured JSON format.

## Machine Learning Models

* **YOLOv8-Seg:** Handles food detection, classification, and instance segmentation.
* **MiDaS:** Provides monocular depth estimation for portion size approximation.

## Backend

Built using **Python** and **REST APIs**, the backend is responsible for:
* Loading ML models.
* Processing input images and running inference.
* Estimating portion sizes and calculating nutrition.
* Returning structured JSON responses.

### Example API Response

```json
{
  "foods": [
    {
      "name": "Chicken Biryani",
      "confidence": 0.96,
      "estimated_weight_g": 320,
      "calories": 540,
      "protein_g": 22,
      "carbohydrates_g": 58,
      "fat_g": 18
    }
  ],
  "total_calories": 540
}
