import React, { useState, useRef, useCallback } from 'react';

const FileUploader = ({ onFileSelected, onNextStep, initialFile }) => {
    const [selectedFileName, setSelectedFileName] = useState(initialFile ? initialFile.name : null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const isValidFile = (file) => {
        if (!file || !file.name) return false;
        const allowedExtensions = ['.obj', '.stl']; 
        const fileName = file.name.toLowerCase();
        return allowedExtensions.some(ext => fileName.endsWith(ext));
    };

    const handleFile = useCallback((file) => {
        if (isValidFile(file)) {
            setSelectedFileName(file.name);
            if (onFileSelected) {
                onFileSelected(file);
            }
        } else {
            alert("Please select or drop a single .obj or .stl file only.");
            setSelectedFileName(null);
            if (onFileSelected) {
                onFileSelected(null);
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [onFileSelected]); 

    const handleInputChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            handleFile(event.target.files[0]);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragEnter = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const handleDragLeave = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFile(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, [handleFile]);

    const handleClearSelection = (e) => {
        e.stopPropagation();
        setSelectedFileName(null);
        if (onFileSelected) {
            onFileSelected(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const dropZoneClasses = `drop-zone ${isDragging ? 'drop-zone-dragging' : ''}`;

    return (
        <div className="file-uploader-container">
            <h2>Upload Your 3D Model</h2>
            <div
                className={dropZoneClasses}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isDragging ? handleButtonClick : undefined}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleInputChange}
                    className="hidden-input"
                    accept=".obj,.stl" 
                />
                <button
                    type="button"
                    className="select-button control-button"
                    onClick={(e) => { e.stopPropagation(); handleButtonClick(); }}
                >
                    Select OBJ/STL File
                </button>
                <div className="drop-text">
                    or drop an OBJ/STL file here
                </div>

                {selectedFileName && (
                    <div className="file-list">
                        <strong>Selected file:</strong>
                        <p className="file-name-display">{selectedFileName}</p>
                        <button
                            type="button"
                            onClick={handleClearSelection}
                            className="clear-button control-button"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>

            <div className="navigation-buttons" style={{ justifyContent: 'flex-end' }}> 
                <button
                    className={`control-button next-button ${!selectedFileName ? 'disabled-button' : ''}`}
                    onClick={onNextStep}
                    disabled={!selectedFileName}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default FileUploader;