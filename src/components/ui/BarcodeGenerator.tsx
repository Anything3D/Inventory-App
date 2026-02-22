import React from 'react';
import Barcode from 'react-barcode';

interface BarcodeGeneratorProps {
    value: string;
    width?: number;
    height?: number;
    fontSize?: number;
}

export const BarcodeGenerator = ({ value, width = 1.5, height = 50, fontSize = 14 }: BarcodeGeneratorProps) => {
    return (
        <div className="bg-white p-2 rounded-lg inline-block">
            <Barcode
                value={value}
                width={width}
                height={height}
                fontSize={fontSize}
                format="CODE128"
                background="#ffffff"
                lineColor="#000000"
            />
        </div>
    );
};
