import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="topbar__brand">Task &amp; Project Tracker</div>
      <nav class="topbar__nav" aria-label="Main navigation">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Dashboard
        </a>
        <a routerLink="/projects" routerLinkActive="active">
          Projects
        </a>
      </nav>
    </header>

    <main class="container">
      <router-outlet />
    </main>
  `,
  styles: [`
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.5rem;
      background: #0f172a;
      color: #f8fafc;
    }
    .topbar__brand {
      font-weight: 700;
      font-size: 1.05rem;
    }
    .topbar__nav {
      display: flex;
      gap: 1.25rem;
    }
    .topbar__nav a {
      color: #cbd5e1;
      text-decoration: none;
      font-weight: 500;
    }
    .topbar__nav a.active {
      color: #ffffff;
      border-bottom: 2px solid #38bdf8;
      padding-bottom: 0.15rem;
    }
    .container {
      max-width: 960px;
      margin: 1.5rem auto;
      padding: 0 1rem;
    }
  `],
})
export class App {}