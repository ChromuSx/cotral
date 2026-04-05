export interface ArrivalDestinationParams {
    arrival?: string;
    destination?: string;
}

export interface UserSession {
    command?: string;
    params?: ArrivalDestinationParams;
    step?: 'arrival' | 'destination';
}
