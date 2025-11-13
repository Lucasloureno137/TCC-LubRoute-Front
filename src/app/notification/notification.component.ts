import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from '../services/config.service';
import { NotificationService } from '../services/notification.service';

interface Notification {
  title: string;
  message: string;
  read: boolean;
  allowMarkAsRead: boolean;
  publicId: string;
  data: any;
}

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  notificationsOpen = false;
  unreadCount = 0;
  notifications = [] as Notification[];
  // Variáveis de paginação
  currentPage = 1;
  itemsPerPage = 5;

  constructor(private notificationService: NotificationService, private http: HttpClient, private configService: ConfigService, private dialog: MatDialog) { }

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    this.notificationService.loadNotifications(); // Carrega as notificações na inicialização
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
  }

  openNotification(notification: any) {
    this.toggleNotifications();
    this.dialog.open(NotificationDialogComponent, {
      width: '300px',
      data: { title: notification.title, message: notification.message, allowMarkAsRead: notification.allowMarkAsRead, data: notification.data }
    });

    // Marcar como lida ao abrir o diálogo se não estiver lida
    if (!notification.read) {
      this.markAsRead(notification);
    }
  }

  markAsRead(notification: any) {
    if (notification.allowMarkAsRead) {
      notification.read = true;
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      // Marcar como lida no servidor
      this.markAsReadOnServer(notification);

      // reoordena as notificações para que as não lidas fiquem no topo
      this.notifications.sort((a, b) => {
        if (a.read && !b.read) {
          return 1;
        }
        if (!a.read && b.read) {
          return -1;
        }
        return 0;
      });
    }
  }
  markAsReadOnServer(notification: any) {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    this.http.post(baseUrl + '/lubvel/notificacao/marcar-lida?publicId=' + notification.publicId, {}, { headers }).subscribe();
  }

  get paginatedNotifications() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.notifications.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if ((this.currentPage * this.itemsPerPage) < this.notifications.length) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => {
      if (!n.read) {
        this.markAsRead(n);
      }
    });
  }

}
