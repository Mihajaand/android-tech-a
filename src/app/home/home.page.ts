import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  nom = '';
  moyenne: number | null = null;
  etudiants: any[] = [];

  apiUrl = 'http://192.168.88.102:8000';

  @ViewChild('statChartCanvas') statChartCanvas!: ElementRef;
  statChart: any;

  constructor(private http: HttpClient, private alertCtrl: AlertController) {}

  ngOnInit() {
    this.loadEtudiants();
  }

  getObservation(moy: number) {
    if (moy >= 10) return 'admis';
    if (moy >= 5) return 'redoublant';
    return 'exclu';
  }

  ajouter() {
    if (!this.nom || this.moyenne == null) return;
    this.http.post(`${this.apiUrl}/add_etudiant.php`, {
      nom: this.nom,
      moyenne: this.moyenne
    }).subscribe(() => {
      this.nom = '';
      this.moyenne = null;
      this.loadEtudiants();
    });
  }

  async supprimer(e: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmer',
      message: 'Supprimer cet étudiant ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Oui',
          handler: () => {
            this.http.delete(`${this.apiUrl}/delete_etudiant.php?id=${e.numEt}`).subscribe(() => {
              this.loadEtudiants();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  modifier(e: any) {
    const newNom = prompt("Modifier le nom", e.nom);
    const newMoyenne = prompt("Modifier la moyenne", e.moyenne);
    if (newNom !== null && newMoyenne !== null) {
      this.http.put(`${this.apiUrl}/update_etudiant.php`, {
        numEt: e.numEt,
        nom: newNom,
        moyenne: parseFloat(newMoyenne)
      }).subscribe({
        next: () => {
          this.loadEtudiants();
        },
        error: (error) => {
          console.error('Erreur lors de la modification', error);
        }
      });
    }
  }

  moyenneClasse() {
    if (!this.etudiants.length) return 0;
    const total = this.etudiants.reduce((sum, e) => sum + parseFloat(e.moyenne), 0);
    return parseFloat((total / this.etudiants.length).toFixed(2));
  }

  maxMoyenne() {
    if (!this.etudiants.length) return 0;
    return parseFloat(Math.max(...this.etudiants.map(e => parseFloat(e.moyenne))).toFixed(2));
  }

  minMoyenne() {
    if (!this.etudiants.length) return 0;
    return parseFloat(Math.min(...this.etudiants.map(e => parseFloat(e.moyenne))).toFixed(2));
  }

  loadEtudiants() {
    this.http.get<any[]>('http://192.168.88.102:8000/get_etudiants.php').subscribe(
      data => {
        this.etudiants = data;
  
        // 🔁 attendre un tout petit moment que le DOM se mette à jour
        setTimeout(() => {
          this.createChart();
        }, 100);  
      },
      error => {
        console.error('Erreur de chargement', error);
      }
    );
  }
  

  createChart() {
    if (this.statChart) {
      this.statChart.destroy();
    }

    const moyenne = this.moyenneClasse();
    const min = this.minMoyenne();
    const max = this.maxMoyenne();

    this.statChart = new Chart(this.statChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Moyenne classe', 'Moyenne min', 'Moyenne max'],
        datasets: [{
          label: 'Statistiques',
          data: [moyenne, min, max],
          backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}
