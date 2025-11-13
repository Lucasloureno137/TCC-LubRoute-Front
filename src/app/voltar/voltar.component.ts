import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-voltar',
  templateUrl: './voltar.component.html',
  styleUrl: './voltar.component.css'
})
export class VoltarComponent {
  constructor(private router: Router, private location: Location) { }

  backPage() {
    this.location.back();
  }

}
