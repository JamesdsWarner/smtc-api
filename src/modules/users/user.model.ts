export class User {
  public name: string;
  public id: string;
  public userType: "temporary" | "permanent";

  constructor(name: string, id: string, userType: "temporary" | "permanent") {
    this.name = name;
    this.id = id;
    this.userType = userType;
  }
}
