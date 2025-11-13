import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userName = new BehaviorSubject<string>(localStorage.getItem('user_name') || 'Nome Usuário');
  currentUserName = this.userName.asObservable();

  private isUserManager = new BehaviorSubject<string>(localStorage.getItem('isUserManager') || 'false');
  currentIsUserManager = this.isUserManager.asObservable();

  private isAdmin = new BehaviorSubject<boolean>(localStorage.getItem('isAdmin') === 'true');
  currentIsAdmin = this.isAdmin.asObservable();

  private companyNameSource = new BehaviorSubject<string>(localStorage.getItem('cliente_nome') || '');
  currentCompanyName = this.companyNameSource.asObservable();

  private clienteId = new BehaviorSubject<string>(localStorage.getItem('cliente_id') || '');
  currentClienteId = this.clienteId.asObservable();

  setCompanyName(name: string) {
    localStorage.setItem('cliente_nome', name);
    this.companyNameSource.next(name);
  }

  setClienteId(id: string) {
    localStorage.setItem('cliente_id', id);
    this.clienteId.next(id);
  }

  updateUserName(name: string) {
    this.userName.next(name);
    localStorage.setItem('user_name', name);
  }

  updateIsUserManager(isUserManager: string) {
    this.isUserManager.next(isUserManager);
    localStorage.setItem('isUserManager', isUserManager);
  }

  updateIsAdmin(isAdmin: boolean) {
    this.isAdmin.next(isAdmin);
    localStorage.setItem('isAdmin', isAdmin.toString());
  }

  clearUser() {
    this.userName.next('Nome Usuário');
    this.isUserManager.next('false');
    this.isAdmin.next(false);
    this.companyNameSource.next('');
    this.clienteId.next('');
    localStorage.removeItem('user_name');
    localStorage.removeItem('isUserManager');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('cliente_nome');
    localStorage.removeItem('cliente_id');
  }
}
