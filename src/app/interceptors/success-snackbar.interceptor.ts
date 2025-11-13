import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class SuccessSnackbarInterceptor implements HttpInterceptor {

    constructor(private snackBar: MatSnackBar) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(event => {                
                if (event instanceof HttpResponse && event.status === 201 && (event.body as ApiResponse<any>).created) {
                    this.openSnackBar('Registro criado com sucesso!');
                }
            })
        );
    }

    openSnackBar(message: string) {
        this.snackBar.open(message, 'Fechar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
        });
    }
}
