import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private _http: HttpClient) { }

  getConversation(prompt: string, mode: string) {
    return this._http.post<{ conversation: string[], speech: string[] }>('http://127.0.0.1:5000/getConversation', { prompt: prompt, mode: mode });
  }
}
