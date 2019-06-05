import { PhotoboothCloudGreetingCard } from "./gallery-greeting-card";

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

export class PhotoboothCloudMediaExtended implements PhotoboothCloudMedia, PhotoboothCloudGreetingCard, IGalleryMedia {
    type: string
    eventID: string
    eventRoute: string
    createdAt: Date
    updatedAt: Date
    galleryImageLoaded: boolean
    viewerImageLoaded: boolean
    srcAfterFocus: string

    /** Photoboothcloud Card fields (it act like media in gallery, but it is not real media.) */
    id?: string;
    author?: string;
    text: string;
    eventCreatorID: string;
    dominant_color: string;
    preview_xxs: PreviewDetails;
}


export class MaterialPalette {
    /** Some colors are not imported from 
     * https://material.io/tools/color/#!/?view.left=0&view.right=0&primary.color=DD2C00 */
    
    static RED           = "#d50000";
    static PINK          = "#c51162";
    static DEEP_PURPLE   = "#6200ea";
    static INDIGO        = "#304ffe";
    static BLUE          = "#2962ff";
    static LIGHT_BLUE    = "#0091ea";
    static TEAL          = "#00bfa5";
    static GREEN         = "#00c853";
    static LIGHT_GREEN   = "#64dd17";
    static LIME          = "#aeea00";
    static YELLOW        = "#ffd600";
    static AMBER         = "#ffab00";
    static ORANGE        = "#ff6d00";
    static DEEP_ORANGE   = "#dd2c00";


    static getAllColors(): Array<string> {
        const arr = new Array<string>()
        arr.push(MaterialPalette.RED)
        arr.push(MaterialPalette.PINK)
        arr.push(MaterialPalette.DEEP_PURPLE)
        arr.push(MaterialPalette.INDIGO)
        arr.push(MaterialPalette.BLUE)
        arr.push(MaterialPalette.LIGHT_BLUE)
        arr.push(MaterialPalette.TEAL)
        arr.push(MaterialPalette.GREEN)
        arr.push(MaterialPalette.LIGHT_GREEN)
        arr.push(MaterialPalette.LIME)
        arr.push(MaterialPalette.YELLOW)
        arr.push(MaterialPalette.AMBER)
        arr.push(MaterialPalette.ORANGE)
        arr.push(MaterialPalette.DEEP_ORANGE)

        return arr;
    }

    static getRandomColor(): string {
        const randomIndex = MaterialPalette.randomIntFromInterval(0, 13)
        return MaterialPalette.getAllColors()[randomIndex]
    }

    static randomIntFromInterval(min, max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    }
}
