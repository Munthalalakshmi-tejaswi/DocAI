import { useRef, useState } from "react";
import { FileText, UploadCloud, LoaderCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function FileUpload({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setValidationError("");
    setSelectedFile(null);

    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setValidationError("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("The PDF must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  function handleUpload() {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  }

  return (
    <section className="upload-card">
      <div className="upload-icon">
        <UploadCloud size={32} />
      </div>

      <h2>Upload your PDF</h2>
      <p className="muted">
        Choose a document and ask questions about its contents.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        hidden
      />

      <button
        type="button"
        className="button button-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <FileText size={18} />
        Choose PDF
      </button>

      {selectedFile && (
        <div className="selected-file">
          <FileText size={19} />
          <span>{selectedFile.name}</span>
          <small>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</small>
        </div>
      )}

      {validationError && (
        <p className="field-error" role="alert">{validationError}</p>
      )}

      <button
        type="button"
        className="button button-primary upload-submit"
        onClick={handleUpload}
        disabled={!selectedFile || loading}
      >
        {loading ? (
          <>
            <LoaderCircle className="spin" size={18} />
            Processing PDF...
          </>
        ) : (
          "Upload and Process"
        )}
      </button>

      <p className="file-note">PDF only · Maximum file size: 10 MB</p>
    </section>
  );
}

export default FileUpload;
