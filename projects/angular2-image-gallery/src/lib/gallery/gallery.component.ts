import {
  ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren
} from '@angular/core'
import { ImageService } from '../services/image.service'
import { HttpClient } from '@angular/common/http'
import { Observable, Subject, Subscription } from 'rxjs'
import { PhotoboothCloudMediaExtended, PhotoboothCloudMedia, MaterialPalette, PreviewDetails } from '../gallery-media';
import { PhotoboothCloudGreetingCard } from '../gallery-greeting-card';

@Component({
    selector: 'gallery',
    templateUrl: './gallery.component.html',
    styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit, OnDestroy, OnChanges {
    gallery: Array<any> = []
    imageDataStaticPath: string = 'assets/img/gallery/'
    imageDataCompletePath: string = ''
    dataFileName: string = 'data.json'
    images: Array<any> = []
    minimalQualityCategory = 'preview_xxs'
    viewerSubscription: Subscription
    rowIndex: number = 0
    rightArrowInactive: boolean = false
    leftArrowInactive: boolean = false
    providedDataSubscription: any
    
    // PhotoboothCloud App region
    mediaAddedSubscription: Subscription;
    mediaRemoveSubscription: Subscription;
    mediaUpdateSubscription: Subscription;
    commentViewerSubscription: Subscription;
    @Output() commentViewerSecondEmmitter: EventEmitter<boolean> = new EventEmitter<boolean>()
    @Output() selectedMediaEmmitter: EventEmitter<any> = new EventEmitter<any>()
    @Output() deleteImgElementEmitter: EventEmitter<string> = new EventEmitter<string>()
    commentViewerOpenedPropagateSubject: Subject<boolean> = new Subject<boolean>()
    greetingCardAuthorWidth: number;
    greetingCardTextWidth: number;

    // end region

    @Input('flexBorderSize') providedImageMargin: number = 3
    @Input('flexImageSize') providedImageSize: number = 7
    @Input('galleryName') providedGalleryName: string = ''
    @Input('metadataUri') providedMetadataUri: string = undefined
    @Input('maxRowsPerPage') rowsPerPage: number = 200

    // PhotobooothCloud App region
    @Input('data') providedData: Observable<Array<any>> = undefined
    @Input('innerGalleryShowed') innerGalleryShowed: boolean
    @Input('mediaAdded') providedMediaAdded: Subject<PhotoboothCloudMedia> = new Subject<PhotoboothCloudMedia>()
    @Input('mediaRemove') providedMediaRemove: Subject<String> = new Subject<String>() 
    @Input('mediaUpdated') providedMediaUpdate: Subject<PhotoboothCloudMedia | PhotoboothCloudGreetingCard> = new Subject<PhotoboothCloudMedia | PhotoboothCloudGreetingCard>()
    @Input('commentViewerOpened') providedCommentViewerOpened: Subject<boolean> = new Subject<boolean>()
    @Input('showEditState') providedShowEditState: boolean = false;
    @Output('deleteMediaEmitter') providedDeleteMediaEmitter: EventEmitter<any> = new EventEmitter<any>()

    // end region

    @Output() viewerChange = new EventEmitter<boolean>()

    @ViewChild('galleryContainer') galleryContainer: ElementRef
    @ViewChildren('imageElement') imageElements: QueryList<any>

    @HostListener('window:scroll', ['$event']) triggerCycle(event: any): void {
        this.scaleGallery()
    }

    @HostListener('window:resize', ['$event']) windowResize(event: any): void {
        this.render()
        this.photoboothCloudResizeHandler()
    }

    constructor(public imageService: ImageService, 
                public http: HttpClient, 
                public changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        setTimeout(() => {
            this.fetchDataAndRender()
        }, 0)

       

        this.viewerSubscription = this.imageService.showImageViewerChanged$
            .subscribe((visibility: boolean) => this.viewerChange.emit(visibility))

        this.mediaAddedSubscription  = this.providedMediaAdded.subscribe((newMedia: PhotoboothCloudMedia | PhotoboothCloudGreetingCard) => this.AddMedia(newMedia))
        this.mediaRemoveSubscription = this.providedMediaRemove.subscribe((id: String) => this.RemoveMedia(id))
        this.mediaUpdateSubscription = this.providedMediaUpdate.subscribe((newCard: any) => this.UpdateCardURL(newCard))
        this.commentViewerSubscription = this.providedCommentViewerOpened.subscribe((openClose: boolean) => this.CommentViewerChanged(openClose))

    }

    ngOnChanges(changes: SimpleChanges): void {
        // input params change
        // console.log("Simple Changes ", changes)
        if (changes.providedShowEditState && (changes.providedShowEditState.previousValue !== undefined)) {
            return
        }
        if (changes['providedGalleryName'] !== undefined) {
            this.fetchDataAndRender()
        } else {
            this.render()
        }
    }

    ngOnDestroy(): void {
        if (this.viewerSubscription) {
            this.viewerSubscription.unsubscribe()
        }
        if (this.providedDataSubscription) {
            this.providedDataSubscription.unsubscribe()
        }
        if (this.mediaAddedSubscription) {
            this.mediaAddedSubscription.unsubscribe()
        }
        if (this.commentViewerSubscription) {
            this.commentViewerSubscription.unsubscribe()
        }
        if (this.mediaRemoveSubscription) {
            this.mediaRemoveSubscription.unsubscribe()
        }
        if (this.mediaUpdateSubscription) {
            this.mediaUpdateSubscription.unsubscribe()
        }
    }

    photoboothCloudResizeHandler() {
        
        // GREETING_CARD section
        let authorElements = document.getElementsByClassName("greeting-card-author")
        const width = (document.getElementsByClassName("element-container-style")[0] as HTMLElement).offsetWidth
        this.greetingCardAuthorWidth = width - 30; // Minus 15 px margin from left and right
        this.greetingCardTextWidth =  width - 30;  // Minus 15 px margin from left and right
    
        // LIVE STREAM section
        

    }

    openImageViewer(img: any): void {
        this.imageService.updateImages(this.images)
        this.imageService.updateSelectedImageIndex(this.images.indexOf(img))
        setTimeout(() => {
            this.selectedMediaEmmitter.emit(img)
        }, 0)
        this.imageService.showImageViewer(true)
    }

    /**
     * direction (-1: left, 1: right)
     */
    navigate(direction: number): void {
        if ((direction === 1 && this.rowIndex < this.gallery.length - this.rowsPerPage)
            || (direction === -1 && this.rowIndex > 0)) {
            this.rowIndex += (this.rowsPerPage * direction)
        }
        this.refreshNavigationErrorState()
    }

    calcImageMargin(): number {
        const galleryWidth = this.getGalleryWidth()
        const ratio = galleryWidth / 1920
        return Math.round(Math.max(1, this.providedImageMargin * ratio))
    }

    private fetchDataAndRender(): void {
        this.imageDataCompletePath = this.providedMetadataUri

        // Photoboothcloud app extension
        if (this.providedData) {
            this.providedDataSubscription = this.providedData.subscribe(media => {
                let extendedData: Array<PhotoboothCloudMediaExtended> = media
                console.log('Proslijeden data 53', extendedData)

                extendedData.forEach((element) => {
                    
                    if (element.type === "GREETING_CARD" || element.type === "LIVE_STREAM") {
                        element['galleryImageLoaded'] = false
                        element['viewerImageLoaded'] = false
                        element['srcAfterFocus'] = ''
                        element.preview_xxs = <PreviewDetails>{}
                        
                        element.preview_xxs.width  = 230
                        element.preview_xxs.height = 210

                        element['width'] = "230px"
                        element['height'] = "210px"
                    }
                })

                this.images = extendedData
                this.imageService.updateImages(this.images)

                this.images.forEach(image => {
                    image['galleryImageLoaded'] = false
                    image['viewerImageLoaded'] = false
                    
                    if (image.type === "PHOTO")
                        image['srcAfterFocus'] = image[this.minimalQualityCategory]['path']
                    else image['srcAfterFocus'] = ''
                })
                this.render()
                // this.render()

                // Set greeting cards style
                this.photoboothCloudResizeHandler()
            })

        } else {

            // Primary galley implementation
            if (!this.providedMetadataUri) {
                this.imageDataCompletePath = this.providedGalleryName !== '' ?
                    `${this.imageDataStaticPath + this.providedGalleryName}/${this.dataFileName}` :
                    this.imageDataStaticPath + this.dataFileName
            }
    
            this.http.get(this.imageDataCompletePath)
              .subscribe(
                (data: Array<any>) => {
                        this.images = data
                        this.imageService.updateImages(this.images)
    
                        this.images.forEach(image => {
                          image['galleryImageLoaded'] = false
                          image['viewerImageLoaded'] = false
                          image['srcAfterFocus'] = ''
                        })
                        // twice, single leads to different strange browser behaviour
                        this.render()
                        this.render()
                    },
                  err => {
                        if (this.providedMetadataUri) {
                          console.error(`Provided endpoint '${this.providedMetadataUri}' did not serve metadata correctly or in the expected format.
          See here for more information: https://github.com/BenjaminBrandmeier/angular2-image-gallery/blob/master/docs/externalDataSource.md,
          Original error: ${err}`)
                        } else {
                            console.error(`Did you run the convert script from angular2-image-gallery for your images first? Original error: ${err}`)
                        }
                  },
                () => undefined)
        }
    }

    private render(): void {
        this.gallery = []

        let tempRow = [this.images[0]]
        let currentRowIndex = 0
        let i = 0

        for (i; i < this.images.length; i++) {
            while (this.images[i + 1] && this.shouldAddCandidate(tempRow, this.images[i + 1])) {
                i++
            }
            if (this.images[i + 1]) {
                tempRow.pop()
            }
            this.gallery[currentRowIndex++] = tempRow

            tempRow = [this.images[i + 1]]
        }

        this.scaleGallery()
    }


    public AddMedia(newMediaOrCard: PhotoboothCloudMedia | PhotoboothCloudGreetingCard) {
        const newExtMedia: PhotoboothCloudMediaExtended = newMediaOrCard as PhotoboothCloudMediaExtended

        newExtMedia['galleryImageLoaded'] = false
        newExtMedia['viewerImageLoaded'] = false
        newExtMedia['srcAfterFocus'] = ''
        
        if (newExtMedia.type === "GREETING_CARD") {
            newExtMedia.dominant_color = MaterialPalette.DARK_BLUE
            newExtMedia.preview_xxs = <PreviewDetails>{}
            
            newExtMedia.preview_xxs.width  = 210
            newExtMedia.preview_xxs.height = 210

            newExtMedia['width'] = "210px"
            newExtMedia['height'] = "210px"

        } else if (newExtMedia.type === "LIVE_STREAM") {
            newExtMedia.dominant_color = MaterialPalette.LIGHT_BLUE
            newExtMedia.preview_xxs = <PreviewDetails>{}
            
            newExtMedia.preview_xxs.width  = 210
            newExtMedia.preview_xxs.height = 210

            newExtMedia['width'] = "210px"
            newExtMedia['height'] = "210px"
        }
        
        this.images.splice(0, 0, newExtMedia);       // Add on 0 index of array 
        // this.images.push(newExtMedia)                Add on end of array
        this.imageService.updateImages(this.images)

        this.render() 

    }

    public RemoveMedia(id: String) {
        let mediaFound: boolean = false;
        for(let i = 0; i < this.images.length; i++){ 
            if ( this.images[i].id === id) {
              this.images.splice(i, 1); 
              i--;
              mediaFound = true;
            }
         }
         if (mediaFound) {
            this.imageService.updateImages(this.images)
            this.render()
         }
    }

    /** Used to update greeting card URL */
    public UpdateCardURL(newMediaOrCard: PhotoboothCloudMediaExtended) {
        
        for (var i = 0; i < this.images.length; i++) {
            if (this.images[i].id === newMediaOrCard.id) {
                this.images[i].url = newMediaOrCard.url;
                console.log("updated card in gall.")
                break;
            }
        }
    }

    public CommentViewerChanged(openClose: boolean) {
        this.commentViewerOpenedPropagateSubject.next(openClose)
    }


    private shouldAddCandidate(imgRow: Array<any>, candidate: any): boolean {
        const oldDifference = this.calcIdealHeight() - this.calcRowHeight(imgRow)
        imgRow.push(candidate)
        const newDifference = this.calcIdealHeight() - this.calcRowHeight(imgRow)

        return Math.abs(oldDifference) > Math.abs(newDifference)
    }

    private calcRowHeight(imgRow: Array<any>): number {
        const originalRowWidth = this.calcOriginalRowWidth(imgRow)

        const ratio = (this.getGalleryWidth() - (imgRow.length - 1) * this.calcImageMargin()) / originalRowWidth
        const rowHeight = imgRow[0][this.minimalQualityCategory]['height'] * ratio
        return rowHeight
    }

    private calcOriginalRowWidth(imgRow: Array<any>): number {
        let originalRowWidth = 0
        imgRow.forEach(img => {
            const individualRatio = this.calcIdealHeight() / img[this.minimalQualityCategory]['height']
            img[this.minimalQualityCategory]['width'] = img[this.minimalQualityCategory]['width'] * individualRatio
            img[this.minimalQualityCategory]['height'] = this.calcIdealHeight()
            originalRowWidth += img[this.minimalQualityCategory]['width']
        })

        return originalRowWidth
    }

    private calcIdealHeight(): number {
        return this.getGalleryWidth() / (80 / this.providedImageSize) + 100
    }

    private getGalleryWidth(): number {
        if (this.galleryContainer.nativeElement.clientWidth === 0) {
            // for IE11
            return this.galleryContainer.nativeElement.scrollWidth
        }
        return this.galleryContainer.nativeElement.clientWidth
    }

    private scaleGallery(): void {
        let imageCounter = 0
        let maximumGalleryImageHeight = 0

        this.gallery.slice(this.rowIndex, this.rowIndex + this.rowsPerPage)
          .forEach(imgRow => {
            const originalRowWidth = this.calcOriginalRowWidth(imgRow)

            if (imgRow !== this.gallery[this.gallery.length - 1]) {
                setTimeout(() => {
                    const ratio = (this.getGalleryWidth() - (imgRow.length - 1) * this.calcImageMargin()) / originalRowWidth
                    imgRow.forEach((img: any) => {
                        img['width'] = img[this.minimalQualityCategory]['width'] * ratio
                        img['height'] = img[this.minimalQualityCategory]['height'] * ratio
                        maximumGalleryImageHeight = Math.max(maximumGalleryImageHeight, img['height'])
                        this.checkForAsyncLoading(img, imageCounter++)
                    })
                })
            } else {
                imgRow.forEach((img: any) => {
                    img.width = img[this.minimalQualityCategory]['width']
                    img.height = img[this.minimalQualityCategory]['height']
                    maximumGalleryImageHeight = Math.max(maximumGalleryImageHeight, img['height'])
                    this.checkForAsyncLoading(img, imageCounter++)
                })
            }
        })

        this.minimalQualityCategory = maximumGalleryImageHeight > 375 ? 'preview_xs' : 'preview_xxs'
        this.refreshNavigationErrorState()

        this.changeDetectorRef.detectChanges()
    }

    private checkForAsyncLoading(image: any, imageCounter: number): void {

        if (this.imageElements) {
            const imageElements = this.imageElements.toArray()
            if (image['galleryImageLoaded'] ||
                (imageElements.length > 0 &&
                imageElements[imageCounter] &&
                this.isScrolledIntoView(imageElements[imageCounter].nativeElement))
                || (image[this.minimalQualityCategory]['path'] !== '')) {
                
                image['galleryImageLoaded'] = true
                image['srcAfterFocus'] = image[this.minimalQualityCategory]['path']
            } else {
                image['srcAfterFocus'] = ''
            }
        }
    }

    private isScrolledIntoView(element: any): boolean {
        const elementTop = element.getBoundingClientRect().top
        const elementBottom = element.getBoundingClientRect().bottom

        return elementTop < window.innerHeight && elementBottom >= 0 && (elementBottom > 0 || elementTop > 0)
    }

    private refreshNavigationErrorState(): void {
        this.leftArrowInactive = this.rowIndex == 0
        this.rightArrowInactive = this.rowIndex > (this.gallery.length - this.rowsPerPage)
    }

    public openSelectedMedia(media: any) {
        if (media && media.type) {
            switch(media.type) {
                case "GREETING_CARD": {
                     this.selectedMediaEmmitter.emit(media); 
                     break;
                }
                case "LIVE_STREAM": {
                      this.selectedMediaEmmitter.emit(media)
                      break;
                }
                case "PHOTO":    {
                      // Goes on Open image viewer.
                      break;
                }
                default: {
                    break;
                }
            }
        }
    }

    public commentViewerBridge(event) {
        this.commentViewerSecondEmmitter.emit(event)
    }

    public deleteMedia(media: any) {
       this.providedDeleteMediaEmitter.emit(media)
    }

}
