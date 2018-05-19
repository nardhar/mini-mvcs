class Link {
  constructor(name, href) {
    this.name = name;
    this.href = href;
  }

  ref(object) {
    return {
      [this.name]: { href: this.replace(object) },
    };
  }

  refString(value) {
    return {
      [this.name]: { href: value },
    };
  }

  // busca todos los :abc y reemplaza con el valor del mismo nombre de object
  replace(object) {
    const matches = this.href.match(/:[a-zA-Z_]+/g);
    if (!matches) return this.href;

    return matches.reduce((href, match) => {
      return href.replace(new RegExp(match, 'g'), object[match.substr(1)]);
    }, this.href);
  }
}

module.exports = Link;
