import React, { useState, useCallback } from 'react';
import ModelViewer from './ModelViewer'; 

const PreviewAndSupport = ({
    selectedFile,
    needsSupport,
    onSupportChange,
    onPreviousStep,
    onSkip, 
    onFinish
}) => {
    const [modelError, setModelError] = useState('');

    const handleCheckboxChange = (e) => {
        onSupportChange(e.target.checked);
    };

    const handleModelLoadError = useCallback((errorMessage) => {
        setModelError(errorMessage);
    }, []);

    return (
        <div className="preview-and-support-container">
            <h2 className="title">Preview & Support Options</h2>
            <div className="viewer-placeholder">
                {selectedFile ? (
                    modelError ? (
                        <div className="viewer-content" style={{color: 'red', padding: '20px'}}>
                            <p><strong>Error loading preview:</strong> {modelError}</p>
                            <p>Please ensure the file is a valid 3D model (STL, OBJ).</p>
                        </div>
                    ) : (
                        <ModelViewer file={selectedFile} onModelLoadError={handleModelLoadError} />
                    )
                ) : (
                    <div className="viewer-content">
                        <p>No file selected for preview.</p>
                    </div>
                )}
                 {(!selectedFile || modelError) && <div className="grid-background"></div> }
                 {(!selectedFile || modelError) && <div className="mock-controls"><div>+/-</div><div>⤢</div></div> }
            </div>

            <div className="support-checkbox-container">
                <input
                    type="checkbox"
                    id="needsSupportCheckbox"
                    checked={needsSupport}
                    onChange={handleCheckboxChange}
                    className="checkbox"
                />
                <label htmlFor="needsSupportCheckbox" className="checkbox-label">
                    This print may require support structures.
                </label>
            </div>

            <div className="navigation-buttons">
                <button
                    className="control-button back-button"
                    onClick={onPreviousStep}
                >
                    Back
                </button>
                <div className="finish-actions">
                    <button
                        className="control-button skip-button" 
                        onClick={() => {
                            onSupportChange(false); 
                            onFinish(); 
                        }}
                    >
                        Skip Supports & Finish
                    </button>
                    <button
                        className="control-button finish-button"
                        onClick={onFinish}
                        disabled={!selectedFile || modelError} 
                    >
                        Finish with Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreviewAndSupport;