export class Session {
  public name: string;
  public id: string;
  public hostPlayer: string;

  constructor(name: string, id: string, hostPlayer: string) {
    this.name = name;
    this.id = id;
    this.hostPlayer = hostPlayer;
  }
}
