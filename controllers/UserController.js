class UserController {
    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formEl = document.getElementById(formIdCreate);
        this.formElUpdate = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    onEdit() {
        document.querySelector('#box-user-update .btn-cancel').addEventListener('click', e => {
            this.showFormCreate();
        });

        this.formElUpdate.addEventListener('submit', evt => {
            evt.preventDefault();

            let btn = this.formElUpdate.querySelector('[type=submit]');
            btn.disabled = true;

            let val = this.getValues(this.formElUpdate);

            let index = this.formElUpdate.dataset.trIndex;

            let tr = this.tableEl.rows[index];
            
            let user = new User();

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, val);




            this.getPhoto(this.formElUpdate).then(
                content => {

                    if (!val._photo) {
                        result._photo = userOld._photo;
                    } else {
                        result._photo = content;
                    }

                    user.loadFromJson(result);

                    user.save();

                    this.getTr(user, tr);

                    this.updateCount();

                    btn.disabled = false;
                    this.showFormCreate();
                },
                err => {

                    console.error(err);

                }
            )
        });
    }

    onSubmit() {
        this.formEl.addEventListener('submit', evt => {

            evt.preventDefault();

            let btn = this.formEl.querySelector('[type=submit]');
            btn.disabled = true;

            let val = this.getValues(this.formEl);
            if (val) {
                this.getPhoto(this.formEl).then(
                    content => {

                        val.photo = content;

                        val.save();

                        this.addLine(val);

                        this.formEl.reset();

                        btn.disabled = false;
                    },
                    err => {

                        console.error(err);

                    }
                )
            }

        });
    }

    getPhoto(formEl) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();

            let el = [...formEl.elements].filter(item => {
                if (item.name === 'photo') {
                    return item;
                }
            })

            let file = el[0].files[0];

            fileReader.onload = () => {

                resolve(fileReader.result);

            }

            fileReader.onerror = evt => {

                reject(evt);

            }

            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                resolve('dist/img/boxed-bg.jpg')
            }
        });

    }

    getValues(formEl) {
        let user = {};
        let isValid = true;
        [...formEl.elements].forEach(function (field, index) {

            if (['name', 'email', 'passowrd'].indexOf(field.name) > -1 && !field.value) {

                field.parentElement.classList.add('has-error');

                isValid = false;
            }

            if (field.name === 'gender') {

                if (field.checked) {

                    user[field.name] = field.value;

                }

            } else if (field.name === 'admin') {

                user[field.name] = field.checked;

            } else {

                user[field.name] = field.value;

            }

        });
        if (!isValid) {
            return isValid;
        }
        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );
    }
    
    selectAll() {
        let users = User.getUsersStorage();

        users.forEach(dataUser => {
            let user = new User();

            user.loadFromJson(dataUser);

            this.addLine(user);
        })
    }
    
    addLine(dataUser) {
        let tr = this.getTr(dataUser);

        this.tableEl.appendChild(tr);

        this.updateCount();
    }

    getTr(dataUser, tr = document.createElement('tr')){

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
            <td>
                <img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm">
            </td>
            <td>${dataUser.name}</td>
            <td>${dataUser.email}</td>
            <td>${dataUser.admin ? 'Sim' : 'Não'}</td>
            <td>${Utils.dateHour(dataUser.register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
            </td>
        `;

        this.addEventsTr(tr);

        return tr;
    }

    addEventsTr(tr) {

        tr.querySelector('.btn-delete').addEventListener('click', e => {
            if (confirm('Deseja realmente excluir?')) {
                let user = new User();

                user.loadFromJson(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();
            }
        });

        tr.querySelector('.btn-edit').addEventListener('click', e => {
            let json = JSON.parse(tr.dataset.user);
            let form = document.querySelector('#form-user-update');

            form.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {

                let field = form.querySelector('[name=' + name.replace('_', '') + ']');
                if (field) {
                    switch (field.type) {
                        case 'file':
                            continue;
                            break;

                        case 'radio':
                            field = form.querySelector('[name=' + name.replace('_', '') + '][value=' + json[name] + ']');
                            field.checked = true;
                            break;

                        case 'checkbox':
                            field.checked = json[name];
                            break;

                        default:
                            field.value = json[name];
                            break;
                    }
                }

            }

            this.formElUpdate.querySelector('.photo').src = json._photo;
            this.showFormUpdate();

        });
    }

    showFormCreate() {
        document.querySelector('#box-user-create').style.display = 'block';
        document.querySelector('#box-user-update').style.display = 'none';
        document.querySelector('#form-user-update').reset();
    }

    showFormUpdate() {
        document.querySelector('#box-user-create').style.display = 'none';
        document.querySelector('#box-user-update').style.display = 'block';
    }

    updateCount() {
        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {
            numberUsers++;
            let user = JSON.parse(tr.dataset.user);
            console.log(user);
            if (user._admin) {
                numberAdmin++;
            }
        });

        document.querySelector('#number-users').innerHTML = numberUsers;
        document.querySelector('#number-users-admin').innerHTML = numberAdmin;
    }
}