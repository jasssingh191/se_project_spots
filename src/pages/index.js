import "../pages/index.css";
import { enableValidation, validationConfig } from "../scripts/validation.js";
import Api from "../utils/Api.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "b8e0f525-8d0e-4996-97e1-4d0f2534c5a8",
    "Content-Type": "application/json",
  },
});

// Card elements
const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardsList = document.querySelector(".cards__list");

// Profile elements
const editProfileBtn = document.querySelector(".profile__edit-btn");
const avatarModalBtn = document.querySelector(".profile__avatar-btn");
const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");

// Edit profile modal elements
const editProfileModal = document.querySelector("#edit__profile-modal");
const editProfileCloseBtn = editProfileModal.querySelector(".modal__close-btn");
const editProfileForm = editProfileModal.querySelector(".modal__form");
const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input",
);
const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input",
);

// New post modal elements
const newPostBtn = document.querySelector(".profile__add-btn");
const newPostModal = document.querySelector("#new-post-modal");
const newPostCloseBtn = newPostModal.querySelector(".modal__close-btn");
const addCardFormElement = newPostModal.querySelector(".modal__form");
const linkInputEl = newPostModal.querySelector("#card-image-input");
const nameInputEl = newPostModal.querySelector("#card-caption-input");

// Avatar modal elements
const avatarModal = document.querySelector("#profile__avatar-modal");
const avatarForm = avatarModal.querySelector(".modal__form");
const avatarSubmitBtn = avatarModal.querySelector(".modal__submit-btn");
const avatarModalCloseBtn = avatarModal.querySelector(".modal__close-btn");
const avatarInputEl = avatarModal.querySelector("#profile__avatar-input");

// Delete modal elements
const deleteModal = document.querySelector("#delete-modal");
const deleteConfirmBtn = deleteModal.querySelector(".modal__submit-btn");

// Preview modal elements
const previewModal = document.querySelector("#preview-modal");
const previewModalCloseBtn = previewModal.querySelector(".modal__close-btn");
const previewImageEl = previewModal.querySelector(".modal__image");
const previewCaptionEl = previewModal.querySelector(".modal__caption");

// Delete state
let cardToDelete = null;
let cardElementToDelete = null;

// Initial data load
Promise.all([api.getInitialCards(), api.getUserInfo()])
  .then(([cards, userData]) => {
    profileNameEl.textContent = userData.name;
    profileDescriptionEl.textContent = userData.about;
    document.querySelector(".profile__avatar").src = userData.avatar;

    cards.forEach(function (item) {
      const cardElement = getCardElement(item);
      cardsList.append(cardElement);
    });
  })
  .catch(console.error);

// Card factory
function getCardElement(data) {
  const cardElement = cardTemplate.cloneNode(true);
  const cardTitleEl = cardElement.querySelector(".card__title");
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardLikeBtnEl = cardElement.querySelector(".card__like-btn");
  const cardDeleteBtnEl = cardElement.querySelector(".card__delete-btn");

  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;
  cardTitleEl.textContent = data.name;

  cardLikeBtnEl.addEventListener("click", () => {
    const isLiked = cardLikeBtnEl.classList.contains("card__like-btn-active");
    const likeAction = isLiked
      ? api.unlikeCard(data._id)
      : api.likeCard(data._id);
    likeAction
      .then(() => {
        cardLikeBtnEl.classList.toggle("card__like-btn-active");
      })
      .catch(console.error);
  });

  cardDeleteBtnEl.addEventListener("click", () => {
    cardToDelete = data._id;
    cardElementToDelete = cardElement;
    openModal(deleteModal);
  });

  cardImageEl.addEventListener("click", () => {
    previewImageEl.src = data.link;
    previewImageEl.alt = data.name;
    previewCaptionEl.textContent = data.name;
    openModal(previewModal);
  });

  return cardElement;
}

// Modal helpers
function openModal(modal) {
  modal.classList.add("modal_opened");
  modal.addEventListener("mousedown", closeOnOverlay);
}

function closeModal(modal) {
  modal.classList.remove("modal_opened");
  modal.removeEventListener("mousedown", closeOnOverlay);
}

function closeOnOverlay(evt) {
  if (evt.target.classList.contains("modal")) {
    closeModal(evt.target);
  }
}

function closeOnEscape(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_opened");
    if (openedModal) {
      closeModal(openedModal);
    }
  }
}

// Form handlers
function handleEditProfileSubmit(evt) {
  evt.preventDefault();
  api
    .editUserInfo({
      name: editProfileNameInput.value,
      about: editProfileDescriptionInput.value,
    })
    .then((data) => {
      profileNameEl.textContent = data.name;
      profileDescriptionEl.textContent = data.about;
      closeModal(editProfileModal);
    })
    .catch(console.error);
}

function handleAvatarSubmit(evt) {
  evt.preventDefault();
  avatarSubmitBtn.textContent = "Saving...";
  api
    .updateAvatar({ avatar: avatarInputEl.value })
    .then((data) => {
      document.querySelector(".profile__avatar").src = data.avatar;
      closeModal(avatarModal);
      evt.target.reset();
    })
    .catch(console.error)
    .finally(() => {
      avatarSubmitBtn.textContent = "Save";
    });
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  api
    .createCard({
      name: nameInputEl.value,
      link: linkInputEl.value,
    })
    .then((newCard) => {
      const cardElement = getCardElement(newCard);
      cardsList.prepend(cardElement);
      closeModal(newPostModal);
      evt.target.reset();
    })
    .catch(console.error);
}

// Event listeners
document.addEventListener("keydown", closeOnEscape);

editProfileBtn.addEventListener("click", function () {
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  openModal(editProfileModal);
});

editProfileCloseBtn.addEventListener("click", function () {
  closeModal(editProfileModal);
});

editProfileForm.addEventListener("submit", handleEditProfileSubmit);

newPostBtn.addEventListener("click", function () {
  openModal(newPostModal);
});

newPostCloseBtn.addEventListener("click", function () {
  closeModal(newPostModal);
});

addCardFormElement.addEventListener("submit", handleAddCardSubmit);

avatarModalBtn.addEventListener("click", function () {
  openModal(avatarModal);
});

avatarModalCloseBtn.addEventListener("click", function () {
  closeModal(avatarModal);
});

avatarForm.addEventListener("submit", handleAvatarSubmit);

deleteConfirmBtn.addEventListener("click", () => {
  api
    .deleteCard(cardToDelete)
    .then(() => {
      cardElementToDelete.remove();
      closeModal(deleteModal);
      cardToDelete = null;
      cardElementToDelete = null;
    })
    .catch(console.error);
});

previewModalCloseBtn.addEventListener("click", function () {
  closeModal(previewModal);
});

enableValidation(validationConfig);
