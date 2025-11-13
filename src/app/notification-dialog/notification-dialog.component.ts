// notification-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

interface DialogData {
  title: string;
  message: string;
  allowMarkAsRead: boolean;
  data: any;
}

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.css']
})
export class NotificationDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, private router: Router) {}

  viewActivities() {
    let data = this.data.data; // formato atual: "04-01-2025 00:00" MM-dd-yyyy HH:mm
    data = data.split(' ')[0].split('-').reverse().join('-'); // Resultado: "2025-01-04"
    
    this.router.navigate(['/app-lista-atividades'], { queryParams: { periodo: 'CALENDAR', startDate: data, endDate: data } });
  }
}