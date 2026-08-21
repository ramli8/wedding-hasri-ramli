package invitation

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/validator"
)

type Service interface {
	GetWedding(ctx context.Context) (WeddingResponse, int, error)
	UpdateWedding(ctx context.Context, req UpdateWeddingRequest) (WeddingResponse, int, error)

	CreateCouple(ctx context.Context, req CreateCoupleRequest) (CoupleResponse, int, error)
	ListCouples(ctx context.Context) ([]CoupleResponse, int, error)
	GetCouple(ctx context.Context, id string) (CoupleResponse, int, error)
	UpdateCouple(ctx context.Context, id string, req UpdateCoupleRequest) (CoupleResponse, int, error)
	DeleteCouple(ctx context.Context, id string) (int, error)

	CreateEvent(ctx context.Context, req CreateEventRequest) (EventResponse, int, error)
	ListEvents(ctx context.Context) ([]EventResponse, int, error)
	GetEvent(ctx context.Context, id string) (EventResponse, int, error)
	UpdateEvent(ctx context.Context, id string, req UpdateEventRequest) (EventResponse, int, error)
	DeleteEvent(ctx context.Context, id string) (int, error)

	CreateStory(ctx context.Context, req CreateStoryRequest) (StoryResponse, int, error)
	ListStories(ctx context.Context) ([]StoryResponse, int, error)
	GetStory(ctx context.Context, id string) (StoryResponse, int, error)
	UpdateStory(ctx context.Context, id string, req UpdateStoryRequest) (StoryResponse, int, error)
	DeleteStory(ctx context.Context, id string) (int, error)

	CreateGalleryItem(ctx context.Context, req CreateGalleryItemRequest) (GalleryItemResponse, int, error)
	ListGalleryItems(ctx context.Context) ([]GalleryItemResponse, int, error)
	GetGalleryItem(ctx context.Context, id string) (GalleryItemResponse, int, error)
	UpdateGalleryItem(ctx context.Context, id string, req UpdateGalleryItemRequest) (GalleryItemResponse, int, error)
	DeleteGalleryItem(ctx context.Context, id string) (int, error)

	CreateFaq(ctx context.Context, req CreateFaqRequest) (FaqResponse, int, error)
	ListFaqs(ctx context.Context) ([]FaqResponse, int, error)
	GetFaq(ctx context.Context, id string) (FaqResponse, int, error)
	UpdateFaq(ctx context.Context, id string, req UpdateFaqRequest) (FaqResponse, int, error)
	DeleteFaq(ctx context.Context, id string) (int, error)

	CreateBankAccount(ctx context.Context, req CreateBankAccountRequest) (BankAccountResponse, int, error)
	ListBankAccounts(ctx context.Context) ([]BankAccountResponse, int, error)
	GetBankAccount(ctx context.Context, id string) (BankAccountResponse, int, error)
	UpdateBankAccount(ctx context.Context, id string, req UpdateBankAccountRequest) (BankAccountResponse, int, error)
	DeleteBankAccount(ctx context.Context, id string) (int, error)

	CreateEwallet(ctx context.Context, req CreateEwalletRequest) (EwalletResponse, int, error)
	ListEwallets(ctx context.Context) ([]EwalletResponse, int, error)
	GetEwallet(ctx context.Context, id string) (EwalletResponse, int, error)
	UpdateEwallet(ctx context.Context, id string, req UpdateEwalletRequest) (EwalletResponse, int, error)
	DeleteEwallet(ctx context.Context, id string) (int, error)

	CreateWishlistItem(ctx context.Context, req CreateWishlistItemRequest) (WishlistItemResponse, int, error)
	ListWishlistItems(ctx context.Context) ([]WishlistItemResponse, int, error)
	GetWishlistItem(ctx context.Context, id string) (WishlistItemResponse, int, error)
	UpdateWishlistItem(ctx context.Context, id string, req UpdateWishlistItemRequest) (WishlistItemResponse, int, error)
	DeleteWishlistItem(ctx context.Context, id string) (int, error)

	CreateSection(ctx context.Context, req CreateSectionRequest) (SectionResponse, int, error)
	ListSections(ctx context.Context) ([]SectionResponse, int, error)
	GetSection(ctx context.Context, id string) (SectionResponse, int, error)
	UpdateSection(ctx context.Context, id string, req UpdateSectionRequest) (SectionResponse, int, error)
	DeleteSection(ctx context.Context, id string) (int, error)

	GetPublicInvitation(ctx context.Context, guestID string) (InvitationResponse, int, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

// --- Wedding Service ---

func (s *service) GetWedding(ctx context.Context) (WeddingResponse, int, error) {
	wedding, err := s.repo.GetWedding(ctx)
	if err != nil {
		if err == ErrWeddingNotFound {
			return WeddingResponse{}, http.StatusNotFound, err
		}
		return WeddingResponse{}, http.StatusInternalServerError, err
	}
	return s.mapWeddingToResponse(wedding), http.StatusOK, nil
}

func (s *service) UpdateWedding(ctx context.Context, req UpdateWeddingRequest) (WeddingResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return WeddingResponse{}, http.StatusBadRequest, err
	}

	if err := validateContent(req.Content); err != nil {
		return WeddingResponse{}, http.StatusBadRequest, err
	}

	wedding, err := s.repo.GetWedding(ctx)
	if err != nil && err != ErrWeddingNotFound {
		return WeddingResponse{}, http.StatusInternalServerError, err
	}
	if wedding == nil {
		wedding = &models.Wedding{ID: 1}
	}

	wedding.GroomName = req.GroomName
	wedding.BrideName = req.BrideName
	wedding.WeddingDate = req.WeddingDate
	wedding.Content = req.Content
	wedding.GiftShippingAddress = req.GiftShippingAddress

	if err := s.repo.UpsertWedding(ctx, wedding); err != nil {
		return WeddingResponse{}, http.StatusInternalServerError, err
	}
	return s.mapWeddingToResponse(wedding), http.StatusOK, nil
}

func (s *service) getExistingWedding(ctx context.Context) (*models.Wedding, int, error) {
	wedding, err := s.repo.GetWedding(ctx)
	if err != nil {
		if err == ErrWeddingNotFound {
			return nil, http.StatusNotFound, ErrWeddingNotFound
		}
		return nil, http.StatusInternalServerError, err
	}
	return wedding, http.StatusOK, nil
}

// validateContent ensures the content JSONB matches the expected section structure.
func validateContent(content models.JSONMap) error {
	if content == nil {
		return nil
	}
	b, err := json.Marshal(content)
	if err != nil {
		return err
	}
	var parsed struct {
		Cover     map[string]json.RawMessage `json:"cover"`
		Music     map[string]json.RawMessage `json:"music"`
		Opening   map[string]json.RawMessage `json:"opening"`
		DressCode map[string]json.RawMessage `json:"dress_code"`
		Livestream map[string]json.RawMessage `json:"livestream"`
		Footer    map[string]json.RawMessage `json:"footer"`
	}
	return json.Unmarshal(b, &parsed)
}

// --- Couple Service ---

func (s *service) CreateCouple(ctx context.Context, req CreateCoupleRequest) (CoupleResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return CoupleResponse{}, http.StatusBadRequest, err
	}

	couple := &models.WeddingCouple{
		Side:            req.Side,
		FullName:        req.FullName,
		Gelar:           req.Gelar,
		PhotoURL:        req.PhotoURL,
		InstagramHandle: req.InstagramHandle,
	}

	if err := s.repo.CreateCouple(ctx, couple); err != nil {
		if err == ErrCoupleAlreadyExists {
			return CoupleResponse{}, http.StatusConflict, err
		}
		return CoupleResponse{}, http.StatusInternalServerError, err
	}
	if err := s.syncWeddingNames(ctx); err != nil {
		return CoupleResponse{}, http.StatusInternalServerError, err
	}
	return s.mapCoupleToResponse(couple), http.StatusCreated, nil
}

func (s *service) ListCouples(ctx context.Context) ([]CoupleResponse, int, error) {
	couples, err := s.repo.ListCouples(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]CoupleResponse, len(couples))
	for i := range couples {
		items[i] = s.mapCoupleToResponse(&couples[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetCouple(ctx context.Context, id string) (CoupleResponse, int, error) {
	couple, statusCode, err := s.getCouple(ctx, id)
	if err != nil {
		return CoupleResponse{}, statusCode, err
	}
	return s.mapCoupleToResponse(couple), http.StatusOK, nil
}

func (s *service) UpdateCouple(ctx context.Context, id string, req UpdateCoupleRequest) (CoupleResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return CoupleResponse{}, http.StatusBadRequest, err
	}

	couple, statusCode, err := s.getCouple(ctx, id)
	if err != nil {
		return CoupleResponse{}, statusCode, err
	}

	if req.Side != "" {
		couple.Side = req.Side
	}
	if req.FullName != nil {
		couple.FullName = *req.FullName
	}
	couple.Gelar = req.Gelar
	couple.PhotoURL = req.PhotoURL
	couple.InstagramHandle = req.InstagramHandle

	if err := s.repo.UpdateCouple(ctx, couple); err != nil {
		if err == ErrCoupleAlreadyExists {
			return CoupleResponse{}, http.StatusConflict, err
		}
		return CoupleResponse{}, http.StatusInternalServerError, err
	}
	if err := s.syncWeddingNames(ctx); err != nil {
		return CoupleResponse{}, http.StatusInternalServerError, err
	}
	return s.mapCoupleToResponse(couple), http.StatusOK, nil
}

func (s *service) DeleteCouple(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteCouple(ctx, id); err != nil {
		if err == ErrCoupleNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getCouple(ctx context.Context, id string) (*models.WeddingCouple, int, error) {
	couple, err := s.repo.GetCoupleByID(ctx, id)
	if err != nil {
		if err == ErrCoupleNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return couple, http.StatusOK, nil
}

// --- Event Service ---

func (s *service) CreateEvent(ctx context.Context, req CreateEventRequest) (EventResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return EventResponse{}, http.StatusBadRequest, err
	}

	event := &models.WeddingEvent{
		Name:        req.Name,
		EventDate:   req.EventDate,
		StartTime:   req.StartTime,
		VenueName:   req.VenueName,
		AddressFull: req.AddressFull,
		GmapsURL:    req.GmapsURL,
		Notes:       req.Notes,
		IsMainEvent: req.IsMainEvent,
		OrderIndex:  req.OrderIndex,
	}

	if err := s.repo.CreateEvent(ctx, event); err != nil {
		return EventResponse{}, http.StatusInternalServerError, err
	}

	if event.IsMainEvent {
		if err := s.repo.ClearMainEvent(ctx, event.ID); err != nil {
			return EventResponse{}, http.StatusInternalServerError, err
		}
	}
	return s.mapEventToResponse(event), http.StatusCreated, nil
}

func (s *service) ListEvents(ctx context.Context) ([]EventResponse, int, error) {
	events, err := s.repo.ListEvents(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]EventResponse, len(events))
	for i := range events {
		items[i] = s.mapEventToResponse(&events[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetEvent(ctx context.Context, id string) (EventResponse, int, error) {
	event, statusCode, err := s.getEvent(ctx, id)
	if err != nil {
		return EventResponse{}, statusCode, err
	}
	return s.mapEventToResponse(event), http.StatusOK, nil
}

func (s *service) UpdateEvent(ctx context.Context, id string, req UpdateEventRequest) (EventResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return EventResponse{}, http.StatusBadRequest, err
	}

	event, statusCode, err := s.getEvent(ctx, id)
	if err != nil {
		return EventResponse{}, statusCode, err
	}

	if req.Name != nil {
		event.Name = *req.Name
	}
	if req.EventDate != nil {
		event.EventDate = req.EventDate
	}
	if req.StartTime != nil {
		event.StartTime = req.StartTime
	}
	if req.VenueName != nil {
		event.VenueName = req.VenueName
	}
	if req.AddressFull != nil {
		event.AddressFull = req.AddressFull
	}
	if req.GmapsURL != nil {
		event.GmapsURL = req.GmapsURL
	}
	if req.Notes != nil {
		event.Notes = req.Notes
	}
	if req.OrderIndex != nil {
		event.OrderIndex = *req.OrderIndex
	}
	if req.IsMainEvent != nil {
		event.IsMainEvent = *req.IsMainEvent
	}

	if err := s.repo.UpdateEvent(ctx, event); err != nil {
		return EventResponse{}, http.StatusInternalServerError, err
	}

	if event.IsMainEvent {
		if err := s.repo.ClearMainEvent(ctx, event.ID); err != nil {
			return EventResponse{}, http.StatusInternalServerError, err
		}
	}
	return s.mapEventToResponse(event), http.StatusOK, nil
}

func (s *service) DeleteEvent(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteEvent(ctx, id); err != nil {
		if err == ErrEventNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getEvent(ctx context.Context, id string) (*models.WeddingEvent, int, error) {
	event, err := s.repo.GetEventByID(ctx, id)
	if err != nil {
		if err == ErrEventNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return event, http.StatusOK, nil
}

// --- Story Service ---

func (s *service) CreateStory(ctx context.Context, req CreateStoryRequest) (StoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return StoryResponse{}, http.StatusBadRequest, err
	}

	story := &models.WeddingStoryEvent{
		EventDate:   req.EventDate,
		Title:       req.Title,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		OrderIndex:  req.OrderIndex,
	}

	if err := s.repo.CreateStory(ctx, story); err != nil {
		return StoryResponse{}, http.StatusInternalServerError, err
	}
	return s.mapStoryToResponse(story), http.StatusCreated, nil
}

func (s *service) ListStories(ctx context.Context) ([]StoryResponse, int, error) {
	stories, err := s.repo.ListStories(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]StoryResponse, len(stories))
	for i := range stories {
		items[i] = s.mapStoryToResponse(&stories[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetStory(ctx context.Context, id string) (StoryResponse, int, error) {
	story, statusCode, err := s.getStory(ctx, id)
	if err != nil {
		return StoryResponse{}, statusCode, err
	}
	return s.mapStoryToResponse(story), http.StatusOK, nil
}

func (s *service) UpdateStory(ctx context.Context, id string, req UpdateStoryRequest) (StoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return StoryResponse{}, http.StatusBadRequest, err
	}

	story, statusCode, err := s.getStory(ctx, id)
	if err != nil {
		return StoryResponse{}, statusCode, err
	}

	if req.EventDate != nil {
		story.EventDate = req.EventDate
	}
	if req.Title != nil {
		story.Title = *req.Title
	}
	if req.Description != nil {
		story.Description = req.Description
	}
	if req.ImageURL != nil {
		story.ImageURL = req.ImageURL
	}
	if req.OrderIndex != nil {
		story.OrderIndex = *req.OrderIndex
	}

	if err := s.repo.UpdateStory(ctx, story); err != nil {
		return StoryResponse{}, http.StatusInternalServerError, err
	}
	return s.mapStoryToResponse(story), http.StatusOK, nil
}

func (s *service) DeleteStory(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteStory(ctx, id); err != nil {
		if err == ErrStoryNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getStory(ctx context.Context, id string) (*models.WeddingStoryEvent, int, error) {
	story, err := s.repo.GetStoryByID(ctx, id)
	if err != nil {
		if err == ErrStoryNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return story, http.StatusOK, nil
}

// --- Gallery Service ---

func (s *service) CreateGalleryItem(ctx context.Context, req CreateGalleryItemRequest) (GalleryItemResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return GalleryItemResponse{}, http.StatusBadRequest, err
	}

	item := &models.WeddingGalleryItem{
		ImageURL:   req.ImageURL,
		Caption:    req.Caption,
		OrderIndex: req.OrderIndex,
	}

	if err := s.repo.CreateGalleryItem(ctx, item); err != nil {
		return GalleryItemResponse{}, http.StatusInternalServerError, err
	}
	return s.mapGalleryItemToResponse(item), http.StatusCreated, nil
}

func (s *service) ListGalleryItems(ctx context.Context) ([]GalleryItemResponse, int, error) {
	items, err := s.repo.ListGalleryItems(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	responses := make([]GalleryItemResponse, len(items))
	for i := range items {
		responses[i] = s.mapGalleryItemToResponse(&items[i])
	}
	return responses, http.StatusOK, nil
}

func (s *service) GetGalleryItem(ctx context.Context, id string) (GalleryItemResponse, int, error) {
	item, statusCode, err := s.getGalleryItem(ctx, id)
	if err != nil {
		return GalleryItemResponse{}, statusCode, err
	}
	return s.mapGalleryItemToResponse(item), http.StatusOK, nil
}

func (s *service) UpdateGalleryItem(ctx context.Context, id string, req UpdateGalleryItemRequest) (GalleryItemResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return GalleryItemResponse{}, http.StatusBadRequest, err
	}

	item, statusCode, err := s.getGalleryItem(ctx, id)
	if err != nil {
		return GalleryItemResponse{}, statusCode, err
	}

	if req.ImageURL != nil {
		item.ImageURL = *req.ImageURL
	}
	if req.Caption != nil {
		item.Caption = req.Caption
	}
	if req.OrderIndex != nil {
		item.OrderIndex = *req.OrderIndex
	}

	if err := s.repo.UpdateGalleryItem(ctx, item); err != nil {
		return GalleryItemResponse{}, http.StatusInternalServerError, err
	}
	return s.mapGalleryItemToResponse(item), http.StatusOK, nil
}

func (s *service) DeleteGalleryItem(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteGalleryItem(ctx, id); err != nil {
		if err == ErrGalleryItemNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getGalleryItem(ctx context.Context, id string) (*models.WeddingGalleryItem, int, error) {
	item, err := s.repo.GetGalleryItemByID(ctx, id)
	if err != nil {
		if err == ErrGalleryItemNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return item, http.StatusOK, nil
}

// --- FAQ Service ---

func (s *service) CreateFaq(ctx context.Context, req CreateFaqRequest) (FaqResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return FaqResponse{}, http.StatusBadRequest, err
	}

	faq := &models.WeddingFaq{
		Question:   req.Question,
		Answer:     req.Answer,
		OrderIndex: req.OrderIndex,
	}

	if err := s.repo.CreateFaq(ctx, faq); err != nil {
		return FaqResponse{}, http.StatusInternalServerError, err
	}
	return s.mapFaqToResponse(faq), http.StatusCreated, nil
}

func (s *service) ListFaqs(ctx context.Context) ([]FaqResponse, int, error) {
	faqs, err := s.repo.ListFaqs(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]FaqResponse, len(faqs))
	for i := range faqs {
		items[i] = s.mapFaqToResponse(&faqs[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetFaq(ctx context.Context, id string) (FaqResponse, int, error) {
	faq, statusCode, err := s.getFaq(ctx, id)
	if err != nil {
		return FaqResponse{}, statusCode, err
	}
	return s.mapFaqToResponse(faq), http.StatusOK, nil
}

func (s *service) UpdateFaq(ctx context.Context, id string, req UpdateFaqRequest) (FaqResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return FaqResponse{}, http.StatusBadRequest, err
	}

	faq, statusCode, err := s.getFaq(ctx, id)
	if err != nil {
		return FaqResponse{}, statusCode, err
	}

	if req.Question != nil {
		faq.Question = *req.Question
	}
	if req.Answer != nil {
		faq.Answer = *req.Answer
	}
	if req.OrderIndex != nil {
		faq.OrderIndex = *req.OrderIndex
	}

	if err := s.repo.UpdateFaq(ctx, faq); err != nil {
		return FaqResponse{}, http.StatusInternalServerError, err
	}
	return s.mapFaqToResponse(faq), http.StatusOK, nil
}

func (s *service) DeleteFaq(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteFaq(ctx, id); err != nil {
		if err == ErrFaqNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getFaq(ctx context.Context, id string) (*models.WeddingFaq, int, error) {
	faq, err := s.repo.GetFaqByID(ctx, id)
	if err != nil {
		if err == ErrFaqNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return faq, http.StatusOK, nil
}

// --- Bank Account Service ---

func (s *service) CreateBankAccount(ctx context.Context, req CreateBankAccountRequest) (BankAccountResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return BankAccountResponse{}, http.StatusBadRequest, err
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	account := &models.WeddingBankAccount{
		BankName:          req.BankName,
		AccountNumber:     req.AccountNumber,
		AccountHolderName: req.AccountHolderName,
		IsActive:          isActive,
	}

	if err := s.repo.CreateBankAccount(ctx, account); err != nil {
		return BankAccountResponse{}, http.StatusInternalServerError, err
	}
	return s.mapBankAccountToResponse(account), http.StatusCreated, nil
}

func (s *service) ListBankAccounts(ctx context.Context) ([]BankAccountResponse, int, error) {
	accounts, err := s.repo.ListBankAccounts(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]BankAccountResponse, len(accounts))
	for i := range accounts {
		items[i] = s.mapBankAccountToResponse(&accounts[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetBankAccount(ctx context.Context, id string) (BankAccountResponse, int, error) {
	account, statusCode, err := s.getBankAccount(ctx, id)
	if err != nil {
		return BankAccountResponse{}, statusCode, err
	}
	return s.mapBankAccountToResponse(account), http.StatusOK, nil
}

func (s *service) UpdateBankAccount(ctx context.Context, id string, req UpdateBankAccountRequest) (BankAccountResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return BankAccountResponse{}, http.StatusBadRequest, err
	}

	account, statusCode, err := s.getBankAccount(ctx, id)
	if err != nil {
		return BankAccountResponse{}, statusCode, err
	}

	if req.BankName != nil {
		account.BankName = *req.BankName
	}
	if req.AccountNumber != nil {
		account.AccountNumber = *req.AccountNumber
	}
	if req.AccountHolderName != nil {
		account.AccountHolderName = *req.AccountHolderName
	}
	if req.IsActive != nil {
		account.IsActive = *req.IsActive
	}

	if err := s.repo.UpdateBankAccount(ctx, account); err != nil {
		return BankAccountResponse{}, http.StatusInternalServerError, err
	}
	return s.mapBankAccountToResponse(account), http.StatusOK, nil
}

func (s *service) DeleteBankAccount(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteBankAccount(ctx, id); err != nil {
		if err == ErrBankAccountNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getBankAccount(ctx context.Context, id string) (*models.WeddingBankAccount, int, error) {
	account, err := s.repo.GetBankAccountByID(ctx, id)
	if err != nil {
		if err == ErrBankAccountNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return account, http.StatusOK, nil
}

// --- Ewallet Service ---

func (s *service) CreateEwallet(ctx context.Context, req CreateEwalletRequest) (EwalletResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return EwalletResponse{}, http.StatusBadRequest, err
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	ewallet := &models.WeddingEwallet{
		ProviderName:   req.ProviderName,
		AccountID:      req.AccountID,
		QrCodeImageURL: req.QrCodeImageURL,
		IsActive:       isActive,
	}

	if err := s.repo.CreateEwallet(ctx, ewallet); err != nil {
		return EwalletResponse{}, http.StatusInternalServerError, err
	}
	return s.mapEwalletToResponse(ewallet), http.StatusCreated, nil
}

func (s *service) ListEwallets(ctx context.Context) ([]EwalletResponse, int, error) {
	ewallets, err := s.repo.ListEwallets(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]EwalletResponse, len(ewallets))
	for i := range ewallets {
		items[i] = s.mapEwalletToResponse(&ewallets[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetEwallet(ctx context.Context, id string) (EwalletResponse, int, error) {
	ewallet, statusCode, err := s.getEwallet(ctx, id)
	if err != nil {
		return EwalletResponse{}, statusCode, err
	}
	return s.mapEwalletToResponse(ewallet), http.StatusOK, nil
}

func (s *service) UpdateEwallet(ctx context.Context, id string, req UpdateEwalletRequest) (EwalletResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return EwalletResponse{}, http.StatusBadRequest, err
	}

	ewallet, statusCode, err := s.getEwallet(ctx, id)
	if err != nil {
		return EwalletResponse{}, statusCode, err
	}

	if req.ProviderName != nil {
		ewallet.ProviderName = *req.ProviderName
	}
	if req.AccountID != nil {
		ewallet.AccountID = *req.AccountID
	}
	if req.QrCodeImageURL != nil {
		ewallet.QrCodeImageURL = req.QrCodeImageURL
	}
	if req.IsActive != nil {
		ewallet.IsActive = *req.IsActive
	}

	if err := s.repo.UpdateEwallet(ctx, ewallet); err != nil {
		return EwalletResponse{}, http.StatusInternalServerError, err
	}
	return s.mapEwalletToResponse(ewallet), http.StatusOK, nil
}

func (s *service) DeleteEwallet(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteEwallet(ctx, id); err != nil {
		if err == ErrEwalletNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getEwallet(ctx context.Context, id string) (*models.WeddingEwallet, int, error) {
	ewallet, err := s.repo.GetEwalletByID(ctx, id)
	if err != nil {
		if err == ErrEwalletNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return ewallet, http.StatusOK, nil
}

// --- Wishlist Service ---

func (s *service) CreateWishlistItem(ctx context.Context, req CreateWishlistItemRequest) (WishlistItemResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return WishlistItemResponse{}, http.StatusBadRequest, err
	}

	item := &models.WeddingWishlistItem{
		ItemName:     req.ItemName,
		ItemImageURL: req.ItemImageURL,
		ItemLink:     req.ItemLink,
	}

	if err := s.repo.CreateWishlistItem(ctx, item); err != nil {
		return WishlistItemResponse{}, http.StatusInternalServerError, err
	}
	return s.mapWishlistItemToResponse(item), http.StatusCreated, nil
}

func (s *service) ListWishlistItems(ctx context.Context) ([]WishlistItemResponse, int, error) {
	items, err := s.repo.ListWishlistItems(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	responses := make([]WishlistItemResponse, len(items))
	for i := range items {
		responses[i] = s.mapWishlistItemToResponse(&items[i])
	}
	return responses, http.StatusOK, nil
}

func (s *service) GetWishlistItem(ctx context.Context, id string) (WishlistItemResponse, int, error) {
	item, statusCode, err := s.getWishlistItem(ctx, id)
	if err != nil {
		return WishlistItemResponse{}, statusCode, err
	}
	return s.mapWishlistItemToResponse(item), http.StatusOK, nil
}

func (s *service) UpdateWishlistItem(ctx context.Context, id string, req UpdateWishlistItemRequest) (WishlistItemResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return WishlistItemResponse{}, http.StatusBadRequest, err
	}

	item, statusCode, err := s.getWishlistItem(ctx, id)
	if err != nil {
		return WishlistItemResponse{}, statusCode, err
	}

	if req.ItemName != nil {
		item.ItemName = *req.ItemName
	}
	if req.ItemImageURL != nil {
		item.ItemImageURL = req.ItemImageURL
	}
	if req.ItemLink != nil {
		item.ItemLink = req.ItemLink
	}

	if err := s.repo.UpdateWishlistItem(ctx, item); err != nil {
		return WishlistItemResponse{}, http.StatusInternalServerError, err
	}
	return s.mapWishlistItemToResponse(item), http.StatusOK, nil
}

func (s *service) DeleteWishlistItem(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteWishlistItem(ctx, id); err != nil {
		if err == ErrWishlistItemNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getWishlistItem(ctx context.Context, id string) (*models.WeddingWishlistItem, int, error) {
	item, err := s.repo.GetWishlistItemByID(ctx, id)
	if err != nil {
		if err == ErrWishlistItemNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return item, http.StatusOK, nil
}

// --- Section Service ---

func (s *service) CreateSection(ctx context.Context, req CreateSectionRequest) (SectionResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return SectionResponse{}, http.StatusBadRequest, err
	}

	isEnabled := true
	if req.IsEnabled != nil {
		isEnabled = *req.IsEnabled
	}

	section := &models.InvitationSection{
		SectionKey: req.SectionKey,
		IsEnabled:  isEnabled,
		OrderIndex: req.OrderIndex,
	}

	if err := s.repo.CreateSection(ctx, section); err != nil {
		if err == ErrSectionAlreadyExists {
			return SectionResponse{}, http.StatusConflict, err
		}
		return SectionResponse{}, http.StatusInternalServerError, err
	}
	return s.mapSectionToResponse(section), http.StatusCreated, nil
}

func (s *service) ListSections(ctx context.Context) ([]SectionResponse, int, error) {
	sections, err := s.repo.ListSections(ctx)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	items := make([]SectionResponse, len(sections))
	for i := range sections {
		items[i] = s.mapSectionToResponse(&sections[i])
	}
	return items, http.StatusOK, nil
}

func (s *service) GetSection(ctx context.Context, id string) (SectionResponse, int, error) {
	section, statusCode, err := s.getSection(ctx, id)
	if err != nil {
		return SectionResponse{}, statusCode, err
	}
	return s.mapSectionToResponse(section), http.StatusOK, nil
}

func (s *service) UpdateSection(ctx context.Context, id string, req UpdateSectionRequest) (SectionResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return SectionResponse{}, http.StatusBadRequest, err
	}

	section, statusCode, err := s.getSection(ctx, id)
	if err != nil {
		return SectionResponse{}, statusCode, err
	}

	if req.IsEnabled != nil {
		section.IsEnabled = *req.IsEnabled
	}
	if req.OrderIndex != nil {
		section.OrderIndex = *req.OrderIndex
	}

	if err := s.repo.UpdateSection(ctx, section); err != nil {
		return SectionResponse{}, http.StatusInternalServerError, err
	}
	return s.mapSectionToResponse(section), http.StatusOK, nil
}

func (s *service) DeleteSection(ctx context.Context, id string) (int, error) {
	if err := s.repo.DeleteSection(ctx, id); err != nil {
		if err == ErrSectionNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) getSection(ctx context.Context, id string) (*models.InvitationSection, int, error) {
	section, err := s.repo.GetSectionByID(ctx, id)
	if err != nil {
		if err == ErrSectionNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}
	return section, http.StatusOK, nil
}

// --- Public Invitation Service ---

// syncWeddingNames keeps weddings.groom_name/bride_name in step with the
// couples rows so the public payload always shows the current names.
func (s *service) syncWeddingNames(ctx context.Context) error {
	wedding, err := s.repo.GetWedding(ctx)
	if err != nil {
		if err == ErrWeddingNotFound {
			return nil
		}
		return err
	}
	couples, err := s.repo.ListCouples(ctx)
	if err != nil {
		return err
	}
	for i := range couples {
		switch couples[i].Side {
		case "pria":
			wedding.GroomName = couples[i].FullName
		case "wanita":
			wedding.BrideName = couples[i].FullName
		}
	}
	return s.repo.UpdateWedding(ctx, wedding)
}

// GetPublicInvitation composes the full invitation payload for the public
// invitation page. guestID is optional: empty or unknown uuid yields
// guest:null without failing the request.
func (s *service) GetPublicInvitation(ctx context.Context, guestID string) (InvitationResponse, int, error) {
	wedding, err := s.repo.GetWedding(ctx)
	if err != nil {
		if err == ErrWeddingNotFound {
			return InvitationResponse{}, http.StatusNotFound, err
		}
		return InvitationResponse{}, http.StatusInternalServerError, err
	}

	couples, err := s.repo.ListCouples(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	events, err := s.repo.ListEvents(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	stories, err := s.repo.ListStories(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	galleryItems, err := s.repo.ListGalleryItems(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	faqs, err := s.repo.ListFaqs(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	bankAccounts, err := s.repo.ListBankAccounts(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	ewallets, err := s.repo.ListEwallets(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	wishlistItems, err := s.repo.ListWishlistItems(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}
	allSections, err := s.repo.ListSections(ctx)
	if err != nil {
		return InvitationResponse{}, http.StatusInternalServerError, err
	}

	res := InvitationResponse{
		Wedding: PublicWedding{
			GroomName:           wedding.GroomName,
			BrideName:           wedding.BrideName,
			WeddingDate:         wedding.WeddingDate,
			Content:             ParseWeddingContent(wedding.Content),
			GiftShippingAddress: wedding.GiftShippingAddress,
		},
		Couples:     make([]PublicCouple, 0, len(couples)),
		Events:      make([]PublicEvent, 0, len(events)),
		Story:       make([]PublicStory, 0, len(stories)),
		Gallery:     make([]PublicGalleryItem, 0, len(galleryItems)),
		Faqs:        make([]PublicFaq, 0, len(faqs)),
		BankAccounts: make([]PublicBankAccount, 0, len(bankAccounts)),
		Ewallets:    make([]PublicEwallet, 0, len(ewallets)),
		Wishlist:    make([]PublicWishlistItem, 0, len(wishlistItems)),
		Sections:    make([]PublicSection, 0, len(allSections)),
	}

	for i := range couples {
		c := &couples[i]
		res.Couples = append(res.Couples, PublicCouple{
			Side:            c.Side,
			FullName:        c.FullName,
			Gelar:           c.Gelar,
			PhotoURL:        c.PhotoURL,
			InstagramHandle: c.InstagramHandle,
		})
	}

	for i := range events {
		e := &events[i]
		res.Events = append(res.Events, PublicEvent{
			ID:          e.ID,
			Name:        e.Name,
			EventDate:   e.EventDate,
			StartTime:   e.StartTime,
			VenueName:   e.VenueName,
			AddressFull: e.AddressFull,
			GmapsURL:    e.GmapsURL,
			Notes:       e.Notes,
			IsMainEvent: e.IsMainEvent,
		})
		if e.IsMainEvent && e.EventDate != nil {
			target := *e.EventDate
			res.CountdownTarget = &target
		}
	}

	for i := range stories {
		st := &stories[i]
		res.Story = append(res.Story, PublicStory{
			EventDate:   st.EventDate,
			Title:       st.Title,
			Description: st.Description,
			ImageURL:    st.ImageURL,
		})
	}

	for i := range galleryItems {
		g := &galleryItems[i]
		res.Gallery = append(res.Gallery, PublicGalleryItem{
			ImageURL: g.ImageURL,
			Caption:  g.Caption,
		})
	}

	for i := range faqs {
		f := &faqs[i]
		res.Faqs = append(res.Faqs, PublicFaq{
			Question: f.Question,
			Answer:   f.Answer,
		})
	}

	for i := range bankAccounts {
		a := &bankAccounts[i]
		if !a.IsActive {
			continue
		}
		res.BankAccounts = append(res.BankAccounts, PublicBankAccount{
			BankName:          a.BankName,
			AccountNumber:     a.AccountNumber,
			AccountHolderName: a.AccountHolderName,
		})
	}

	for i := range ewallets {
		e := &ewallets[i]
		if !e.IsActive {
			continue
		}
		res.Ewallets = append(res.Ewallets, PublicEwallet{
			ProviderName:   e.ProviderName,
			AccountID:      e.AccountID,
			QrCodeImageURL: e.QrCodeImageURL,
		})
	}

	for i := range wishlistItems {
		w := &wishlistItems[i]
		res.Wishlist = append(res.Wishlist, PublicWishlistItem{
			ItemName:     w.ItemName,
			ItemImageURL: w.ItemImageURL,
			ItemLink:     w.ItemLink,
			IsClaimed:    w.ClaimedByGuestID != nil,
		})
	}

	for i := range allSections {
		sec := &allSections[i]
		if !sec.IsEnabled {
			continue
		}
		res.Sections = append(res.Sections, PublicSection{
			SectionKey: sec.SectionKey,
			OrderIndex: sec.OrderIndex,
		})
	}

	if res.CountdownTarget == nil {
		res.CountdownTarget = wedding.WeddingDate
	}

	if guestID != "" {
		guest, err := s.repo.GetGuestByUUID(ctx, guestID)
		if err != nil {
			return InvitationResponse{}, http.StatusInternalServerError, err
		}
		if guest != nil {
			res.Guest = &PublicGuestInfo{
				Name:     guest.Name,
				QRCode:   guest.QRCode,
				Category: guest.GuestCategory.Name,
			}
			if guest.InvitationOpenedAt == nil {
				if err := s.repo.MarkInvitationOpened(ctx, guest.ID); err != nil {
					return InvitationResponse{}, http.StatusInternalServerError, err
				}
			}
		}
	}

	return res, http.StatusOK, nil
}

// --- Mappers ---

func (s *service) mapWeddingToResponse(w *models.Wedding) WeddingResponse {
	content := w.Content
	if content == nil {
		content = models.JSONMap{}
	}
	return WeddingResponse{
		GroomName:           w.GroomName,
		BrideName:           w.BrideName,
		WeddingDate:         w.WeddingDate,
		Content:             content,
		GiftShippingAddress: w.GiftShippingAddress,
		CreatedAt:           w.CreatedAt,
		UpdatedAt:           w.UpdatedAt,
	}
}

func (s *service) mapCoupleToResponse(c *models.WeddingCouple) CoupleResponse {
	return CoupleResponse{
		ID:              c.ID,
		Side:            c.Side,
		FullName:        c.FullName,
		Gelar:           c.Gelar,
		PhotoURL:        c.PhotoURL,
		InstagramHandle: c.InstagramHandle,
		CreatedAt:       c.CreatedAt,
		UpdatedAt:       c.UpdatedAt,
	}
}

func (s *service) mapEventToResponse(e *models.WeddingEvent) EventResponse {
	return EventResponse{
		ID:          e.ID,
		Name:        e.Name,
		EventDate:   e.EventDate,
		StartTime:   e.StartTime,
		VenueName:   e.VenueName,
		AddressFull: e.AddressFull,
		GmapsURL:    e.GmapsURL,
		Notes:       e.Notes,
		IsMainEvent: e.IsMainEvent,
		OrderIndex:  e.OrderIndex,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}

func (s *service) mapStoryToResponse(st *models.WeddingStoryEvent) StoryResponse {
	return StoryResponse{
		ID:          st.ID,
		EventDate:   st.EventDate,
		Title:       st.Title,
		Description: st.Description,
		ImageURL:    st.ImageURL,
		OrderIndex:  st.OrderIndex,
		CreatedAt:   st.CreatedAt,
		UpdatedAt:   st.UpdatedAt,
	}
}

func (s *service) mapGalleryItemToResponse(i *models.WeddingGalleryItem) GalleryItemResponse {
	return GalleryItemResponse{
		ID:         i.ID,
		ImageURL:   i.ImageURL,
		Caption:    i.Caption,
		OrderIndex: i.OrderIndex,
		CreatedAt:  i.CreatedAt,
		UpdatedAt:  i.UpdatedAt,
	}
}

func (s *service) mapFaqToResponse(f *models.WeddingFaq) FaqResponse {
	return FaqResponse{
		ID:         f.ID,
		Question:   f.Question,
		Answer:     f.Answer,
		OrderIndex: f.OrderIndex,
		CreatedAt:  f.CreatedAt,
		UpdatedAt:  f.UpdatedAt,
	}
}

func (s *service) mapBankAccountToResponse(a *models.WeddingBankAccount) BankAccountResponse {
	return BankAccountResponse{
		ID:                a.ID,
		BankName:          a.BankName,
		AccountNumber:     a.AccountNumber,
		AccountHolderName: a.AccountHolderName,
		IsActive:          a.IsActive,
		CreatedAt:         a.CreatedAt,
		UpdatedAt:         a.UpdatedAt,
	}
}

func (s *service) mapEwalletToResponse(e *models.WeddingEwallet) EwalletResponse {
	return EwalletResponse{
		ID:             e.ID,
		ProviderName:   e.ProviderName,
		AccountID:      e.AccountID,
		QrCodeImageURL: e.QrCodeImageURL,
		IsActive:       e.IsActive,
		CreatedAt:      e.CreatedAt,
		UpdatedAt:      e.UpdatedAt,
	}
}

func (s *service) mapWishlistItemToResponse(i *models.WeddingWishlistItem) WishlistItemResponse {
	return WishlistItemResponse{
		ID:           i.ID,
		ItemName:     i.ItemName,
		ItemImageURL: i.ItemImageURL,
		ItemLink:     i.ItemLink,
		IsClaimed:    i.ClaimedByGuestID != nil,
		ClaimedAt:    i.ClaimedAt,
		CreatedAt:    i.CreatedAt,
		UpdatedAt:    i.UpdatedAt,
	}
}

func (s *service) mapSectionToResponse(sec *models.InvitationSection) SectionResponse {
	return SectionResponse{
		ID:         sec.ID,
		SectionKey: sec.SectionKey,
		IsEnabled:  sec.IsEnabled,
		OrderIndex: sec.OrderIndex,
		CreatedAt:  sec.CreatedAt,
		UpdatedAt:  sec.UpdatedAt,
	}
}
