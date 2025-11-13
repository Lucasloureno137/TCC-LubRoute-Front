import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmacao-operacao',
  templateUrl: './confirmacao-operacao.component.html',
  styleUrl: './confirmacao-operacao.component.css'
})
export class ConfirmacaoOperacaoComponent implements OnInit {
  currentStep: number = 3;

  constructor(private router: Router) { }

  ngOnInit(): void {
    scrrolToTop();
  }

  irParaDashboard() {
    this.router.navigate(['/dashboard']);
  }

  cadastrarNovaRotina() {
    this.router.navigate(['/app-form-filter-pt-lubrificacao']);
  }

}

function scrrolToTop() {
  window.scrollTo(0, 0);
}