export function convertAndValidateCoords(coordX: string, coordY: string): { latitude: number, longitude: number } | null {
    const latitude = parseFloat(coordX);
    const longitude = parseFloat(coordY);
    if (!isNaN(latitude) && !isNaN(longitude) && !(latitude === 0 && longitude === 0)) {
        return { latitude, longitude };
    }
    return null;
}

export function formatBoolean(value: boolean | null | undefined): string {
    if (value === true) {
        return 'Sì';
    } else if (value === false) {
        return 'No';
    } else {
        return 'Non disponibile';
    }
}
