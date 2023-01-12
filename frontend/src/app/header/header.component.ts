import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../book.service';
import { Book } from '../models/book';
import { User } from '../models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  constructor(
    private router: Router,
    private userService: UserService,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    this.initLoggedUser();
  }

  user: User = null;
  photoName: string;
  picture?: string | ArrayBuffer;

  notifications: Array<string> = new Array();
  isNotificationTemporary: Array<boolean> = new Array();
  suggestedBooksByUser: Array<Book> = new Array();

  toHomePage() {
    if (localStorage.getItem('loggedUser') != null) {
      const userType = JSON.parse(localStorage.getItem('loggedUser')).type;
      this.router.navigate([userType]);
    } else {
      this.router.navigate(['']);
    }
  }

  logout() {
    localStorage.removeItem('loggedUser');
    this.router.navigate(['']);
  }

  goToUserProfile() {
    this.router.navigate(['userProfile']);
  }

  goToSearch() {
    this.router.navigate(['readerSearch']);
  }

  goToRentedBooks() {
    this.router.navigate(['rentedBooks']);
  }

  goToRentHistory() {
    this.router.navigate(['rentHistory']);
  }

  initNotifications() {
    const data = {
      bookIds: this.user.rentedBooks,
    };
    this.bookService.getBooksByIds(data).subscribe((res: any) => {
      if (res.message == 'Error') {
        return;
      }

      for (let i = 0; i < this.user.rentedBooks.length; ++i) {
        const daysLeft = this.calculateDateDiff(
          this.user.rentedBooksDateEnd[i]
        );
        if (daysLeft <= 0) {
          this.notifications.push(
            'Rok za vracanje knjige "' + res.books[i].name + '" je istekao.'
          );

          this.isNotificationTemporary.push(true);
        } else if (daysLeft <= 2) {
          this.notifications.push(
            'Rok za vracanje knjige "' +
              res.books[i].name +
              '" istice za ' +
              daysLeft +
              ' dana.'
          );
          this.isNotificationTemporary.push(true);
        }
      }

      if (this.user.rentedBooks.length == 3) {
        this.notifications.push('Imate 3 knjige na zaduzenju.');
        this.isNotificationTemporary.push(true);
      }

      if (this.user.reservedBooksAvailable.length > 0) {
        const dataBooks = {
          bookIds: this.user.reservedBooksAvailable,
        };

        this.bookService.getBooksByIds(dataBooks).subscribe((res: any) => {
          for (let i = 0; i < res.books.length; ++i) {
            const bookName = res.books[i].name;
            this.notifications.push(
              'Rezervisana knjiga "' +
                bookName +
                '" je dostupna i dodata je u listu zaduzenih knjiga.'
            );
          }
        });

        const dataUser = {
          userId: this.user.id,
        };

        this.userService
          .clearReservedBooksAvailable(dataUser)
          .subscribe((res: any) => {
            if (res.message == 'Error') {
              return;
            }
            this.user = res.user;
            localStorage.setItem('loggedUser', JSON.stringify(this.user));
          });
      }

      if (this.suggestedBooksByUser) {
        for (let i = 0; i < this.suggestedBooksByUser.length; ++i) {
          const bookName = this.suggestedBooksByUser[i].name;
          this.notifications.push(
            'Predlog za dodavanje knjige "' + bookName + '" je prihvacen.'
          );
          this.isNotificationTemporary.push(false);
        }
      }
      if (this.user.status == 'blocked') {
        this.notifications.push('Vas nalog je blokiran.');
        this.isNotificationTemporary.push(true);
      }
    });
  }

  initLoggedUser() {
    this.user = null;
    if (localStorage.getItem('loggedUser') != null) {
      this.user = JSON.parse(localStorage.getItem('loggedUser'));

      const dataUser = {
        id: this.user.id,
      };
      this.userService.getUserById(dataUser).subscribe((res: any) => {
        if (res.message == 'Ok') {
          localStorage.setItem('loggedUser', JSON.stringify(res.user));

          this.user = res.user;

          const data = {
            userId: this.user.id,
          };
          this.bookService
            .getAllAcceptedBooksSuggestedByUser(data)
            .subscribe((res: any) => {
              if (res.message == 'Error') {
                return;
              }
      
              this.suggestedBooksByUser = res.books;
              this.initNotifications();
            });
        }
      });

      this.photoName = '' + this.user.photo;

      const dataPhoto = {
        photoName: this.photoName,
      };
      this.userService.getPhoto(dataPhoto).subscribe({
        next: (img: Blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(img);
          reader.onload = (t) => {
            this.picture = t.target?.result;
          };
        },
      });
    }
  }

  calculateDateDiff(dateEnd: Date) {
    const today = new Date();
    dateEnd = new Date(dateEnd);

    return Math.floor(
      (Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate()) -
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
        (1000 * 60 * 60 * 24)
    );
  }
}
