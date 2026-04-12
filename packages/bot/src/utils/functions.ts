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

export function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
