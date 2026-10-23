"""Export generated originals without changing their lettering or composition."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
GENERATED = Path(r"C:\Users\Kwonriver\.codex\generated_images\01a15455-71fc-73c2-9db7-695a6401de5d")
ASSETS = [
    ("exec-9eb56097-6a7e-48fd-b5c5-cfa1f7adc9c4.png", "gohyang-donation-tax-credit.webp", (1200, 630)),
    ("exec-55039e17-5728-4693-80d7-0e2db4fe87a1.png", "gohyang-donation-tax-credit-tistory.webp", (1080, 1080)),
    ("exec-a9a388dc-bfad-420b-9237-5e18b3a698f3.png", "gohyang-donation-tax-credit-naver.webp", (1200, 720)),
]

if __name__ == "__main__":
    for source, name, size in ASSETS:
        original = Image.open(GENERATED / source).convert("RGB")
        # Preserve proportions and all text. Naver receives a dark green frame
        # because the generator returned a wider source than the final 5:3 slot.
        exported = ImageOps.pad(original, size, method=Image.Resampling.LANCZOS, color="#123b2c")
        target = ROOT / "thumbnails" / name
        exported.save(target, "WEBP", quality=94, method=6)
        print(name, exported.size, target.stat().st_size)
