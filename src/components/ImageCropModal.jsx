import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", error => reject(error));

    image.src = url;
  });
}

async function getCroppedImage(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.88);
}

export default function ImageCropModal({
  image,
  aspect = 1,
  onCancel,
  onCrop
}) {
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const onCropComplete = useCallback(
    (_, croppedPixels) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    try {
      const croppedImage = await getCroppedImage(
        image,
        croppedAreaPixels
      );

      onCrop(croppedImage);
    } catch (error) {
      console.error("Crop failed:", error);
    }
  };

  return (
    <div className="image-crop-overlay">
      <div className="image-crop-modal">

        <div className="image-crop-header">
          <div>
            <h3>Crop image</h3>
            <p>
              Move and zoom the image to choose the area you want.
            </p>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="image-crop-area">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
          />
        </div>

        <div className="image-crop-controls">

          <label>
            <span>Zoom</span>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e =>
                setZoom(Number(e.target.value))
              }
            />
          </label>

        </div>

        <div className="image-crop-actions">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCrop}
          >
            <Check size={16} />
            Use cropped image
          </button>

        </div>

      </div>
    </div>
  );
}