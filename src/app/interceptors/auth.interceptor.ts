import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router, private snackBar: MatSnackBar) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
   
    const token = localStorage.getItem('token');
    const clienteId = localStorage.getItem('cliente_id');

    let authReq = req;

    if (token && !req.url.includes('/login') && !req.url.includes('/esqueci-senha')) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'user-id': clienteId || ''
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.snackBar.open('Acesso negado: sessão expirada ou usuário não logado', 'Fechar', {
            duration: 7000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          setTimeout(() => {
            localStorage.clear();
            this.router.navigate(['/app-login']);
          }, 2000);
        } else {
          console.error('Erro handler:', error);
          this.snackBar.open(error.error.message, 'Fechar', {
            duration: 7000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }

        return throwError(error);
      })
    );
  }
}
