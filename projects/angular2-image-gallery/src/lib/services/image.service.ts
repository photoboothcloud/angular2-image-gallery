import { Injectable } from '@angular/core'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class ImageService {
    private imagesUpdatedSource = new Subject<Array<any>>()
    private imageSelectedIndexUpdatedSource = new Subject<number>()
    private showImageViewerSource = new Subject<boolean>()

    imagesUpdated$: Observable<Array<any>> = this.imagesUpdatedSource.asObservable()
    imageSelectedIndexUpdated$: Observable<number> = this.imageSelectedIndexUpdatedSource.asObservable()
    showImageViewerChanged$: Observable<boolean> = this.showImageViewerSource.asObservable()

    updateImages(images: Array<any>): void {
        this.imagesUpdatedSource.next(images)
    }

    setVideoElementsHiddenIcons(media: Array<any>): Array<any> {
        for (let i = 0; i < media.length; i++) {
            if (media[i].type === "VIDEO") {
                media[i].videoIconsVisible = false;
            }
        }

        return media;
    }

    updateSelectedImageIndex(newIndex: number): void {
        this.imageSelectedIndexUpdatedSource.next(newIndex)
    }

    showImageViewer(show: boolean): void {
        this.showImageViewerSource.next(show)
    }
}
