Crop Intelligence App – Architecture Snapshot (2025-09-27)
=========================================================

Active Components
-----------------
Backend (Flask): `backend/app_integrated.py`
- Auth (JWT), Weather, Dashboard, Community Forum, Chatbot, Optional Multilingual Chatbot
- Crop Yield Prediction via `colab_style_predictor.ColabStyleCropModel`

Model Pipeline
--------------
Datasets (canonical path): `backend/flask_ready_crop_yield_predictor/`
Steps: load -> clean/merge -> feature engineering -> optional target capping -> outlier capping -> label encode -> RandomForestRegressor (200 trees)
Artifacts: `backend/colab_rf_model.joblib`, `backend/colab_rf_model_meta.json`

Key Endpoints
-------------
- POST /api/predict-yield
- POST /api/train-model (?cap_target=true optional)
- GET  /api/model-info/yield
- POST /api/model-info/yield/debug-aligned

Planned Next Enhancements
-------------------------
- Add unit tests for train/predict contract
- Structured logging (replace print)
- Optional SHAP/permutation importance endpoint
- Model version directories (models/<timestamp>/)
- CI schema drift check for datasets

Change Log
----------
2025-09-27: Added architecture doc, marked legacy artifacts for removal, updated .gitignore to whitelist active model.
2025-09-27 (later): Removed legacy predictors, encoder, and unused model binaries; repo now only tracks `colab_rf_model.*`.
2025-09-27 (latest): Deleted `Yieldwiseshayad/` fork of the old YieldWise project to avoid confusion with active codebase.
2025-09-27 (latest+): Removed deprecated `backend/yieldwise_models/` directory since the active pipeline uses only `colab_rf_model.*` artifacts.
2025-09-27 (latest++): Deleted `backend/scripts/` training utilities and legacy model dumps; the pipeline now relies solely on the checked-in colab model.
2025-09-27 (latest+++): Removed placeholder `backend/plant_disease_detector.py` and `backend/yieldwise_advisor.py`; disease detection remains disabled in-app until TensorFlow support returns.
2025-09-27 (latest++++): Archived the standalone `plant-disease-detection/` prototype; kept `backend/disease_detector.py` and added `model/README.md` so teams can supply their own TensorFlow model when re-enabling the feature.
