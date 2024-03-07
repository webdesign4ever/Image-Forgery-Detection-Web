import { useState, useRef } from "react";

function App() {
  const [selectedFile, setSelectedFile] = useState();
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [heatmapSrc, setHeatmapSrc] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  // Create a ref to store the AbortController
  const abortControllerRef = useRef(null);

  const handleFileChange = (event) => {
    setSelectedFile();
    setResult(null);
    setConfidence(null);
    setImageSrc(null);
    setHeatmapSrc(null);
    // If there's an ongoing request, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPredicting(false);

    setSelectedFile(event.target.files[0]);
    setImageSrc(URL.createObjectURL(event.target.files[0]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsPredicting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    // If there's an ongoing request, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController for the new request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        "https://img-forgery-d1470ff951f0.herokuapp.com/predict",
        {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal, // Pass the signal to the fetch call
        }
      );

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const data = await response.json();
      setResult(data.prediction);
      setConfidence(data.confidence.toFixed(2));
      setIsPredicting(false);
      // Generate heatmap after prediction
      const heatmapResponse = await fetch(
        "https://img-forgery-d1470ff951f0.herokuapp.com/generate_heatmap",
        {
          method: "POST",
          signal: abortControllerRef.current.signal, // Pass the signal to the fetch call
        }
      );

      if (!heatmapResponse.ok) {
        throw new Error("HTTP error " + heatmapResponse.status);
      }

      const heatmapData = await heatmapResponse.json();

      // Set heatmap image URL
      const timestamp = Date.now();
      setHeatmapSrc(
        `https://img-forgery-d1470ff951f0.herokuapp.com/${heatmapData.heatmap_path}?t=${timestamp}`
      );
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        console.error(error);
      }
    }
  };

  return (
    <>
      <h1>Image Forgery Detection</h1>
      <div className="form">
        <form
          id="uploadForm"
          method="post"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <label htmlFor="fileInput">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              fill="currentColor"
              className="bi bi-cloud-arrow-up-fill"
              viewBox="0 0 16 16"
            >
              <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0z" />
            </svg>
            <span>Upload Image</span>
          </label>

          <input
            type="file"
            id="fileInput"
            accept=".jpg, .jpeg, .png"
            onChange={handleFileChange}
          />

          {selectedFile && (
            <input
              type="submit"
              id="submit"
              value={isPredicting ? "Loading..." : "Predict"}
              disabled={isPredicting}
            />
          )}
        </form>
      </div>

      <div className="predict">
        {result && (
          <div className="result">
            <div>Prediction: {result}</div>
            {confidence && <div>Confidence: {confidence}%</div>}
          </div>
        )}
        <div className="img">
          <img
            id="uploadedImage"
            src={imageSrc}
            style={{ display: imageSrc ? "block" : "none" }}
          />

          <img
            id="heatmapImage"
            src={heatmapSrc}
            style={{ display: heatmapSrc ? "block" : "none" }}
          />
        </div>
        &nbsp;
      </div>
    </>
  );
}

export default App;
