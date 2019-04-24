export interface PhotoboothCloudMedia {
    type:        string
    eventID:     string
    eventRoute:  string
    createdAt:   Date
    updatedAt:   Date
}

export interface PhotoboothCloudPhoto extends PhotoboothCloudMedia {
    preview_xxs: PreviewDetails    // 500 x 375
    preview_xs:  PreviewDetails    // 1024 x 768  ---> we use xxs here.
    preview_s:   PreviewDetails    // 1440 x 1080  
    preview_m:   PreviewDetails    // 2133 x 1600 ---> we use s here.
    preview_l:   PreviewDetails    // 2880 x 2160 ---> we use raw here.
    preview_xl:  PreviewDetails    // 3840 x 2880 ---> we use raw here.
    raw:         PreviewDetails    // 4000 x 3000 ---> we use raw here.

    dominant_color: string
    dominant_dark_color: string 
}

export interface PreviewDetails {
    path: string;
    width: number;
    height: number;
}

export interface IGalleryMedia {
    galleryImageLoaded: boolean
    viewerImageLoaded: boolean
    srcAfterFocus: string
}

export class PhotoboothCloudMediaExtended implements PhotoboothCloudMedia, IGalleryMedia {
    type: string
    eventID: string
    eventRoute: string
    createdAt: Date
    updatedAt: Date
    galleryImageLoaded: boolean
    viewerImageLoaded: boolean
    srcAfterFocus: string
}
