class ObjetsPerdus {
    constructor(htmlElement = '#app'){
        this.url = "https://data.sncf.com/api/v2/catalog/datasets/objets-trouves-restitution/records?where=gc_obo_date_heure_restitution_c%20is%20null&rows=100&sort=-date&pretty=false&timezone=UTC"
        this.next = ''
        this.total = 0
        this.count = 0
        this.list = new Array()
        this.natures = new Array()
        this.origins = new Array()
        this.target = htmlElement
        this.filters = new Array()
    }
    load(){
        let url = this.next.length == 0 ? this.url : this.next
        fetch(url).then(res => res.json()).then(rep => {
            this.next = this.getNextUrl(rep.links)
            rep.records.forEach(record => {
                if(this.list.indexOf(record.id) == -1){
                    this.list.push(record)
                }
            })
            this.creerCards(this.list)
            this.natures.sort()
            this.creerOption('#filterByNature', this.natures)
            this.origins.sort()
            this.creerOption('#filterByGare', this.origins)
            this.listeners()
            this.count = this.list.length
            this.total = this.total > rep.total_count ? this.total : rep.total_count
            document.querySelector('.navbar-text').innerHTML = `Il y a ${this.total.toLocaleString()} objets trouvés en attente de restitution dont ${this.count} chargés.`

        })
    }
    getNextUrl(links){
        let data = links.filter(link => link.rel == "next")
        if(data && data.length > 0){
            return data[0].href
        }
        return
    }
    creerCards(records){
        document.querySelector('#cards').innerHTML = ''
        records.forEach(element => {
            let nature = element.record.fields.gc_obo_type_c
            let origin = element.record.fields.gc_obo_gare_origine_r_name
            if (this.natures.indexOf(nature) === -1) {
                this.natures.push(nature)
            }
            if (this.origins.indexOf(origin) === -1) {
                this.origins.push(origin)
            }
            new BootstrapCard('#cards', element.record.fields).add()
        })
        let helper = document.querySelector('#filterHelp')
        let nbCards = document.querySelector('#cards').childNodes.length
        nbCards == this.list.length ? helper.innerHTML = "Aucun filtre actif" : helper.innerHTML = nbCards == 1 ? `${nbCards} élément affiché` : `${nbCards} éléments affichés`
    }
    listeners(){
        let selects = document.querySelectorAll('.form-group')
        selects.forEach(select => {
            select.lastElementChild.addEventListener('change', (e) => {
                let action = e.target.id
                let val = e.target.value
                this.creerCards(this[action](val))
            })
        })
    }
    filterById(id){
        return this.list.filter(elem => elem.record.id === id)
    }
    filterByGare(gare){
        let filtre = "gc_obo_gare_origine_r_name"
        if (gare != "all") {
            return this.list.filter(elem => elem.record.fields[filtre] === gare)
        } else {
            return this.list
        }
    }
    filterByNature(nature){
        let filtre = "gc_obo_type_c"
        if(nature != "all"){
            return this.list.filter(elem => elem.record.fields[filtre] === nature)
        } else {
            return this.list
        }
    }
    filterByDate(d){
        return this.list.filter(elem => {
            return moment(elem.record.date).isSameOrAfter(d)
        })
    }
    creerOption(targetId, content){
        let container = document.querySelector(targetId)
        container.innerHTML = '<option value="all">Tout afficher</option>'
        content.forEach(element => {
            let option = document.createElement('option')
            option.innerText = element
            container.appendChild(option)
        })
    }
    runFiltrering(){
        let url = 'https://data.sncf.com/api/v2/catalog/datasets/objets-trouves-restitution/records?rows=100&sort=-date&pretty=false&timezone=UTC&where='
        let requested = ['gc_obo_date_heure_restitution_c IS null']
        let params = {
            gare: 'gc_obo_gare_origine_r_name', 
            type: 'gc_obo_type_c', 
            date: 'date'
        }
        document.querySelector('#filterByGare option:checked').value != "all" ? requested.push(params.gare + '="' + document.querySelector('#filterByGare option:checked').value + '"') : false
        document.querySelector('#filterByNature option:checked').value != "all" ? requested.push(params.type + '="' + document.querySelector('#filterByNature option:checked').value+'"') : false
        document.querySelector('#filterByDate').value != "" ? requested.push(params.date + "='date" + document.querySelector('#filterByDate').value + "'") : false
        this.next = url + encodeURIComponent(requested.join(' AND '))
        this.list = new Array()
        this.load()
    }
}

class BootstrapCard {
    constructor(target, ObjetsPerdusInstance){
        this.target = target
        this.card = {
            title: ObjetsPerdusInstance.gc_obo_type_c,
            subtitle: ObjetsPerdusInstance.gc_obo_gare_origine_r_name,
            content: ObjetsPerdusInstance.gc_obo_nature_c,
            date: moment(ObjetsPerdusInstance.date).fromNow()
        }
    }
    add(){
        let container = document.createElement('div')
        container.classList.add('card')
        let cardBody = document.createElement('div')
        cardBody.classList.add('card-body')
        let cardTitle = document.createElement('h5')
        cardTitle.classList.add('card-title')
        cardTitle.innerText = this.card.title
        let cardSubTitle = document.createElement('h6')
        cardSubTitle.classList.add("card-subtitle", "mb-2", "text-muted")
        cardSubTitle.innerText = this.card.subtitle
        let cardText = document.createElement('p')
        cardText.classList.add('card-text')
        cardText.innerText = this.card.content
        let cardTextMuted = document.createElement('p')
        cardTextMuted.innerHTML = `<small class="text-muted">${this.card.date}</small>`
        let before = moment('08:00:00', 'hh:mm:ss')
        let after = moment('20:00:00', 'hh:mm:ss')
        cardBody.appendChild(cardTitle)
        cardBody.appendChild(cardSubTitle)
        cardBody.appendChild(cardText)
        cardBody.appendChild(cardTextMuted)
        container.appendChild(cardBody)
        let cardBtn = document.createElement('a')
        cardBtn.classList.add('btn', 'btn-primary', 'disabled')
        cardBtn.innerText = "Appeler la gare"
        if(moment().isBetween(before,after)){
            cardBtn.classList.remove('disabled')
            cardBtn.href = 'tel:+333635p#22*'
        }
        cardBody.appendChild(cardBtn)
        document.querySelector(this.target).appendChild(container)
    }
}

moment.locale(navigator.language)

let x = new ObjetsPerdus()
x.load()
document.getElementById('update').addEventListener('click', () => {
    x.load()
})
document.getElementById('filter').addEventListener('click', () => x.runFiltrering())

const filterConditions = (filter) => {
    for(let key in filter) {
        if(item[key] === undefined || item[key] != filter[key])
        return false;
    }
    return true;
}
