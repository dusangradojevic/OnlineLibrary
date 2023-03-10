import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../book.service';
import { Book } from '../models/book';
import { User } from '../models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(
    private userService: UserService,
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.filter();

    // Only to escape error
    const book: Book = new Book();
    this.top3Books.push(book);
    this.top3Books.push(book);
    this.top3Books.push(book);

    this.userReg = new User();

    this.bookService.getAllAcceptedBooks().subscribe((res: any) => {
      this.allBooks = res.books;
      this.initPictures();
    });

    this.bookService.getTop3Books().subscribe((res: any) => {
      this.top3Books = res.books;
      this.currTop3Book = this.top3Books[0];
      this.initTop3Pictures();
    });
  }

  userReg: User;
  usernameLogin: string = '';
  passwordLogin: string = '';
  confirmPassword: string = '';
  msgLogin: string = '';
  msgRegister: string = '';

  allBooks: Book[] = new Array();
  name: string = '';
  author: string = '';

  top3Books: Book[] = new Array();

  pictures: Map<number, string | ArrayBuffer> = new Map();
  top3Pictures: Map<number, string | ArrayBuffer> = new Map();

  currTop3Book: Book = new Book();
  currTop3BookCnt: number = 0;

  filter() {
    if (localStorage.getItem('loggedUser') != null) {
      const user = JSON.parse(localStorage.getItem('loggedUser'));
      if (user.type != 'admin') {
        this.router.navigate(['userHomepage']);
      } else {
        this.router.navigate(['admin']);
      }
    }
  }

  prevText() {
    this.currTop3BookCnt = (3 + this.currTop3BookCnt - 1) % 3;
    this.currTop3Book = this.top3Books[this.currTop3BookCnt];
  }

  nextText() {
    this.currTop3BookCnt = (this.currTop3BookCnt + 1) % 3;
    this.currTop3Book = this.top3Books[this.currTop3BookCnt];
  }

  startSearch() {
    let name2: string = this.name;
    let genres: Array<string> = [];
    let yearFrom: number = -1;
    let yearTo: number = 4000;
    let publisherTmp: string = '';
    let authorTmp: string = this.author;

    const data = {
      name: name2,
      genres: genres,
      yearFrom: yearFrom,
      yearTo: yearTo,
      publisher: publisherTmp,
      author: authorTmp,
    };

    this.bookService.searchAcceptedBooksByParam(data).subscribe((res: any) => {
      this.allBooks = res.books;
      this.initPictures();
    });
  }

  initTop3Pictures() {
    this.top3Pictures.clear();
    this.top3Books.forEach((book) => {
      let id = book.id;
      let photoName = '' + book.photo;

      let data = {
        photoName: photoName,
      };

      let picture: string | ArrayBuffer;
      this.bookService.getBookPhoto(data).subscribe({
        next: (img: Blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(img);
          reader.onload = (t) => {
            picture = t.target?.result;
            this.top3Pictures.set(id, picture);
          };
        },
      });
    });
  }

  initPictures() {
    this.pictures.clear();
    this.allBooks.forEach((book) => {
      let id = book.id;
      let photoName = '' + book.photo;

      let data = {
        photoName: photoName,
      };

      let picture: string | ArrayBuffer;
      this.bookService.getBookPhoto(data).subscribe({
        next: (img: Blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(img);
          reader.onload = (t) => {
            picture = t.target?.result;
            this.pictures.set(id, picture);
          };
        },
      });
    });
  }

  login() {
    const data = {
      username: this.usernameLogin,
      password: this.passwordLogin,
      type: null,
    };

    this.userService.login(data).subscribe((res: any) => {
      if (res && res.errors != undefined && res.errors.length > 0) {
        this.msgLogin = res.errors[0];
      } else {
        localStorage.setItem('loggedUser', JSON.stringify(res.user));
        this.router.navigate(['userHomepage']);
      }
    });
  }

  register() {
    const formData = new FormData();
    formData.set('username', this.userReg.username);
    formData.set('password', this.userReg.password);
    formData.set('confirmPassword', this.confirmPassword);
    formData.set('firstname', this.userReg.firstname);
    formData.set('lastname', this.userReg.lastname);
    formData.set('address', this.userReg.address);
    formData.set('phone', this.userReg.phone);
    formData.set('email', this.userReg.email);
    if (this.userReg.photo != undefined) {
      formData.set('photo', this.userReg.photo);
    }
    formData.set('type', 'reader');
    formData.set('status', 'pending');

    this.userService.register(formData).subscribe((res: any) => {
      if (res && res.errors != undefined && res.errors.length) {
        this.msgRegister = res.errors[0];
      } else {
        alert('Zahtev za registraciju uspesno poslat!');
        window.location.reload();
      }
    });
  }

  selectImage(event) {
    if (event.target.files.length) {
      this.userReg.photo = event.target.files[0];
    }
  }
}
