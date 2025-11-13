import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from './config.service';
import { BehaviorSubject } from 'rxjs';

interface Notification {
  title: string;
  message: string;
  read: boolean;
  allowMarkAsRead: boolean;
  publicId: string;
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private configService: ConfigService) {}

  loadNotifications() {

    // Se for admin localStorage.isAdmin é true não tem notificações
    if (localStorage.getItem('isAdmin') === 'true') {
      return
    }

    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/notificacao', { headers }).subscribe((response: any) => {
      const notifications = response.data.map((item: any) => ({
        title: montaTituloAtividadePendente(item.titulo, item.dataHoraNotificacao),
        read: item.lida,
        message: item.mensagem,
        allowMarkAsRead: item.allowMarkAsRead,
        publicId: item.publicId,
        data: item.dataHoraNotificacao,
      }));

      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(notifications.filter((n: { read: any; }) => !n.read).length);
    });
  }
}

function montaTituloAtividadePendente(titulo: any, dataHoraNotificacao: any) {
  if (titulo != "Atividade Pendente de execução") {
    return titulo;
  } else {
    // Substitui o "-" por "/" e faz um substring para pegar apenas a data
    const dataFormatada = dataHoraNotificacao.replace(/-/g, '/').substring(0, 10);
    return titulo + " " + dataFormatada;
  }
}
