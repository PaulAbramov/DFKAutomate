export class Profession {
    static Gardening = new Profession("Gardening")
    static Fishing = new Profession("Fishing")
    static Mining = new Profession("Mining")
    static Foraging = new Profession("Foraging")

    constructor(name) {
        this.name = name;
    }
}