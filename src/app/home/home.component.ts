import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApiService } from '../api.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';


interface Clip {
  audio_base64: string;
  text: string;
  speaker: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  providers: [
    ApiService
  ],
  imports: [
    MatSelectModule,
    FontAwesomeModule,
    HttpClientModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent implements OnInit {
  prompt: string = '';
  mode: string = 'podcast';
  conversation: any = [];
  clips: Clip[] = [];
  currentClip: number = 0;
  audio!: HTMLAudioElement;
  text: string = '';
  speaker: string = '';
  isLoading: boolean = false;
  isMouthOpen1: boolean = false;
  isMouthOpen2: boolean = false;
  imgpath1: string = 'assets/person1-mclose.png';
  imgpath2: string = 'assets/person2-mclose.png';
  mouthInterval1 = setInterval(this.toggleMouth1, 100);
  mouthInterval2 = setInterval(this.toggleMouth2, 100);
  userQuestion: string = '';
  selectedMode: string = 'podcast';

  constructor(
    private _apiservice: ApiService, 
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getConversation(prompt: string, mode: string) {
    this.isLoading = true;
    console.log("Submitted");
    this._apiservice.getConversation(this.userQuestion, this.selectedMode).subscribe(res => {
      this.conversation = res.conversation;
      if (res.speech && Array.isArray(res.speech)) {
        this.clips = res.speech.map((clip: any) => ({
          audio_base64: clip.audio_base64 || '',
          text: clip.text || '',
          speaker: clip.speaker || ''
        }));
        console.log('Clips array after mapping:', this.clips);
        this.playNextClip();
      } else {
        console.error('Error: res.speech is not a valid array or is undefined.');
      }
      this.isLoading = false;
    });
  }

  playNextClip() {
    if (this.currentClip < this.clips.length) {
      let clip = this.clips[this.currentClip];
      console.log('Current clip:', clip);

      if (clip && clip.audio_base64) {
        let binarystring = atob(clip.audio_base64);
        let len = binarystring.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binarystring.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const blobUrl = URL.createObjectURL(blob);
        this.audio.src = blobUrl;
        isPlatformBrowser(this.platformId) ? this.audio.src = blobUrl : null;

        // this.audio.src = clip.audio_base64;
        this.text = clip.text;
        this.speaker = clip.speaker.toLowerCase();
        if (this.speaker == 'person1') { this.mouthInterval1 = setInterval(() => this.toggleMouth1(), 100); }
        if (this.speaker == 'person2') { this.mouthInterval2 = setInterval(() => this.toggleMouth2(), 100); }
        // this.audio.play();

        // Move to the next clip when current clip ends
        this.audio.onended = () => {
          if (this.speaker == 'person1') { clearInterval(this.mouthInterval1); }
          if (this.speaker == 'person2') { clearInterval(this.mouthInterval2); }
          this.currentClip += 1;
          this.playNextClip();
        };
      } else {
        console.error('Audio or text is missing for the current clip:', clip);
        this.currentClip += 1;
        this.playNextClip();
      }
    } else {
      console.log('All clips played.');
      this.text = 'fin.';
      clearInterval(this.mouthInterval1);
      clearInterval(this.mouthInterval2);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    console.log('File selected: ', formData);

    this.getConversation(this.prompt, 'pdf');
  }

  getSpeaker(line: any): string {
    return Object.keys(line)[0];
  }
  
  getSpeech(line: any): string {
    return line[this.getSpeaker(line)];
  }

  toggleMouth1() {
    if (this.isMouthOpen1) {
      this.imgpath1 = 'assets/person1-mclose.png';
    } else {
      this.imgpath1 = 'assets/person1-mopen.png';
    }
    this.isMouthOpen1 = !this.isMouthOpen1
  }

  toggleMouth2() {
    if (this.isMouthOpen2) {
      this.imgpath2 = 'assets/person2-mclose.png';
    } else {
      this.imgpath2 = 'assets/person2-mopen.png';
    }
    this.isMouthOpen2 = !this.isMouthOpen2
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      console.log("REACHED Platform Browser")
      this.audio = new Audio();
      console.log("Initialised audio")

      
    } else {
      // console.error('Audio API is not available in this environment.');
    }
  }
}
