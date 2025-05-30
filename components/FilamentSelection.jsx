import React from 'react';

const FilamentSelection = ({
    selectedFilaments, 
    onFilamentToggle,
    onPreviousStep,
    onNextStep,
    selectionLimit = 1, 
    currentPrinterType,
    availableMaterials 
}) => {

    const handleItemClick = (material) => { 
        onFilamentToggle(material.material_name);
    };

    let displayableFilaments = availableMaterials || [];
    if (currentPrinterType) {
        const typeLower = currentPrinterType.toLowerCase();
        if (typeLower === "fdm") {
            displayableFilaments = (availableMaterials || []).filter(m => m.material_type.toUpperCase() === 'FILAMENT');
        } else if (["sla", "dlp"].includes(typeLower.toUpperCase())) {
            displayableFilaments = (availableMaterials || []).filter(m => m.material_type.toUpperCase() === 'RESIN');
        }
    }
    
    const isNextDisabled = selectedFilaments.length === 0 || selectedFilaments.length > selectionLimit;
    const titlePrinterType = currentPrinterType || "Choose";

    return (
        <div className="filament-selection-container">
            <h2>{titlePrinterType} - Choose Filament - limit: {selectionLimit}</h2>

            {displayableFilaments.length === 0 && <p>No materials available for the selected printer type, or materials are still loading.</p>}

            <div className="filament-grid">
                {displayableFilaments.map((material) => {
                    const isSelected = selectedFilaments.includes(material.material_name);
                    const isDisabled = !isSelected && selectedFilaments.length >= selectionLimit;
                    return (
                        <div
                            key={material.material_id}
                            className={`filament-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && handleItemClick(material)}
                        >
                            <div className="image-placeholder">
                                <span>{material.material_name.substring(0,3)}</span>
                            </div>
                            <div className="filament-info">
                                <input
                                    type="checkbox" 
                                    id={`filament-${material.material_id}`}
                                    checked={isSelected}
                                    onChange={() => {}} 
                                    disabled={isDisabled}
                                    className="checkbox"
                                />
                                <label
                                    htmlFor={`filament-${material.material_id}`}
                                    className="filament-name"
                                >
                                    {material.material_name} ({material.material_color || 'N/A Color'})
                                    <br/>
                                    <small>Type: {material.material_type} | Stock: {material.material_quantity} {material.material_unit}</small>
                                </label>
                            </div>
                        </div>
                    );
                })}
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
                    onClick={onNextStep}
                    disabled={isNextDisabled}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default FilamentSelection;