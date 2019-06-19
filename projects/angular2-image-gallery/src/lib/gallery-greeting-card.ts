export interface PhotoboothCloudGreetingCard {
    id?: string;
    author?: string;
    text: string;
    eventID: string;
    eventCreatorID: string;
    createdAt: Date;
    updatedAt: Date;
    numberOfViews:  number;
    url: string;
    dominant_color: string;
}