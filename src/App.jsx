import { useState, useRef } from "react";
import { MdFeaturedPlayList } from "react-icons/md";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { GiProcessor } from "react-icons/gi";
import { AiOutlineHeatMap } from "react-icons/ai";
import { RiListUnordered } from "react-icons/ri";

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
      <div className="header rowdies-regular">
        <h1>Image Forgery Detection</h1>
      </div>
      <section className="forgery-types">
        <div>
          <p>
            The system utilizes CNNs to automatically identify three common
            image forgeries:
          </p>
          <ul className="features-list">
            <li>
              <div className="icon">
                <MdFeaturedPlayList size={25} />
              </div>
              IMAGE SPLICING
            </li>
            <li>
              <div className="icon">
                <MdFeaturedPlayList size={25} />
              </div>
              COPY-MOVE FORGERY
            </li>
            <li>
              <div className="icon">
                <MdFeaturedPlayList size={25} />
              </div>
              OBJECT REMOVAL
            </li>
          </ul>
        </div>
      </section>
      <section className="process-ctn">
        <h1 className="heading-primary">PROCESS</h1>
        <div className="process">
          <div className="process-step">
            <h1 className="process-icon heading-secondary">
              <span>
                <GiProcessor size={40} />
              </span>
              Data Preprocessing
            </h1>
            <p>
              Input images are preprocessed (e.g., resizing) for compatibility
              with the CNN.
            </p>
          </div>
          <div className="process-step">
            <h1 className="process-icon heading-secondary">
              <span>
                <MdFeaturedPlayList size={40} />
              </span>
              Feature Extraction
            </h1>
            <p>
              CNNs are employed to automatically extract features from the
              images. These features capture inconsistencies introduced during
              forgery
            </p>
          </div>
          <div className="process-step">
            <h1 className="process-icon heading-secondary">
              <span>
                <RiListUnordered size={40} />
              </span>
              Classification
            </h1>
            <p>The extracted features are used to train a classifier</p>
          </div>
          <div className="process-step">
            <h1 className="process-icon heading-secondary">
              <span>
                <AiOutlineHeatMap size={40} />
              </span>
              GRADCAM Heatmap
            </h1>
            <p>
              Grad-CAM generates a heatmap highlighting the image regions that
              the CNN model found most influential for its classification.
            </p>
          </div>
        </div>
      </section>
      <section className="forgery-detection-system">
        <h1>Got An Image? Try Our Forgery Detection System Right Away</h1>
        <div className="form">
          <form
            id="uploadForm"
            method="post"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
          >
            <label htmlFor="fileInput">
              <div className="photo-icon">
                <MdOutlineAddPhotoAlternate size={40} />
              </div>
              <div className="upload-btn">Upload Image</div>
            </label>

            <input
              type="file"
              id="fileInput"
              accept=".jpg, .jpeg, .png"
              onChange={handleFileChange}
            />

            <div className="img">
              <div className="uploadedImage">
                <img
                  id="uploadedImage"
                  src={imageSrc}
                  style={{ display: imageSrc ? "block" : "none" }}
                />
              </div>

              {selectedFile && (
                <input
                  type="submit"
                  id="submit"
                  value={isPredicting ? "Loading..." : "Predict"}
                  disabled={isPredicting}
                />
              )}
              <div className="heatmapImage">
                <img
                  id="heatmapImage"
                  src={heatmapSrc}
                  style={{ display: heatmapSrc ? "block" : "none" }}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="predict">
          {result && (
            <div className="result">
              <table>
                <tr>
                  <td>
                    <div>Prediction:</div>
                  </td>
                  <td>
                    <div> {result}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div>Confidence: </div>
                  </td>
                  <td>{confidence && <div>{confidence}%</div>}</td>
                </tr>
              </table>
            </div>
          )}
          &nbsp;
        </div>
      </section>
    </>
  );
}

export default App;
