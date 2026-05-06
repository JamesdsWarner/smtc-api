export class User {
  public name: string;
  public id: string;
  public pinHash: string;

  constructor(name: string, id: string, pinHash: string) {
    this.name = name;
    this.id = id;
    this.pinHash = pinHash;
  }
}
