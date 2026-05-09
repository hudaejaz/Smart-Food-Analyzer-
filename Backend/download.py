import urllib.request, os
os.makedirs("app/models", exist_ok=True)
url = "https://github.com/isl-org/MiDaS/releases/download/v3/dpt_hybrid_384.pt"
print("Downloading MiDaS weights (~470MB)...")
urllib.request.urlretrieve(url, "app/models/dpt_hybrid_384.pt")
print("Done!")