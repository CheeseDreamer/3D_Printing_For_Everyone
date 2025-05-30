import React from 'react';

const printQualities = ["Standard", "High Detail", "Draft"]; 

const PrintSettings = ({
    selectedPrinterType,
    selectedPrintQuality,
    onPrinterTypeChange,
    onPrintQualityChange,
    onPreviousStep,
    onNext, 
    availablePrinters 
}) => {

    const handleTypeChange = (e) => onPrinterTypeChange(e.target.value);
    const handleQualityChange = (e) => onPrintQualityChange(e.target.value);

    const isNextDisabled = !selectedPrinterType || !selectedPrintQuality;

    const printerOptions = availablePrinters || ["SLA", "SLS", "FDM", "DLP", "MJF", "EBM"]; // Fallback αν δεν φορτώσουν

    return (
        <div className="print-settings-container">
            <h2>Select Printer Type & Quality</h2>

            <div className="form-group">
                <label htmlFor="printerType">Printer Type</label>
                <select
                    id="printerType"
                    value={selectedPrinterType}
                    onChange={handleTypeChange}
                    className="select-dropdown"
                >
                    <option value="" disabled>Select Type</option>
                    {printerOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="printQuality">Print Quality</label>
                <select
                    id="printQuality"
                    value={selectedPrintQuality}
                    onChange={handleQualityChange}
                    className="select-dropdown"
                >
                    <option value="" disabled>Select Quality</option>
                    {printQualities.map(quality => (
                        <option key={quality} value={quality}>{quality}</option>
                    ))}
                </select>
            </div>

            <div className="navigation-buttons">
                <button
                    className="control-button back-button"
                    onClick={onPreviousStep}
                >
                    Back
                </button>
                <button
                    className={`control-button next-button ${isNextDisabled ? 'disabled-button' : ''}`}
                    onClick={onNext} 
                    disabled={isNextDisabled}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default PrintSettings;