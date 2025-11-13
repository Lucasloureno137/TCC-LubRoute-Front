// ...existing code...
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'lubvel-front';
  showLayout: boolean = false;

  private routesWithoutAppLayout = ['/app-login', '/register', '/forgot-password', '/admin/app-selecionar-empresa'];

  // constructor atualizado para injetar DateAdapter e forçar pt-BR
  constructor(private router: Router, private dateAdapter: DateAdapter<any>) {
    this.dateAdapter.setLocale('pt-BR');
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showLayout = !this.routesWithoutAppLayout.includes(event.urlAfterRedirects);
      }
    });
  }
}
// ...existing code...
