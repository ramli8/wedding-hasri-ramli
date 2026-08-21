package invitation

import (
	"encoding/json"
	"net/http"

	"github.com/base-go/backend/pkg/response"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return Handler{service: service}
}

func (h Handler) decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "invalid request body")
		return false
	}
	return true
}

// --- Public Invitation Handler ---

// GetPublicInvitation godoc
// @Summary Get the composed invitation payload (public)
// @Description Single request payload for the invitation page: wedding content, couples, events, story, gallery, faqs, gift accounts, wishlist claim status, enabled sections. Optional guest uuid personalizes the response and marks the invitation as opened once.
// @Tags Invitation
// @Produce json
// @Param guest query string false "Guest UUID for personalization"
// @Success 200 {object} InvitationResponse
// @Failure 404 {object} map[string]string "Wedding not configured yet"
// @Router /invitation [get]
func (h Handler) GetPublicInvitation(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetPublicInvitation(r.Context(), r.URL.Query().Get("guest"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// --- Wedding Handlers ---

// GetWedding godoc
// @Summary Get wedding detail (singleton)
// @Description Get the single wedding record; 404 if not configured yet
// @Tags Wedding
// @Produce json
// @Success 200 {object} WeddingResponse
// @Failure 404 {object} map[string]string "Wedding not found"
// @Router /wedding [get]
func (h Handler) GetWedding(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetWedding(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateWedding godoc
// @Summary Update wedding detail (singleton)
// @Description Update the single wedding record (names, date, content JSONB, gift address)
// @Tags Wedding
// @Accept json
// @Produce json
// @Param request body UpdateWeddingRequest true "Update wedding request"
// @Success 200 {object} WeddingResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Wedding not found"
// @Router /wedding [put]
func (h Handler) UpdateWedding(w http.ResponseWriter, r *http.Request) {
	var req UpdateWeddingRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateWedding(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// --- Couple Handlers ---

// CreateCouple godoc
// @Summary Create a couple entry
// @Description Create bride or groom profile (side must be unique)
// @Tags Wedding Couples
// @Accept json
// @Produce json
// @Param request body CreateCoupleRequest true "Create couple request"
// @Success 201 {object} CoupleResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 409 {object} map[string]string "Couple side already exists"
// @Router /wedding/couples [post]
func (h Handler) CreateCouple(w http.ResponseWriter, r *http.Request) {
	var req CreateCoupleRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateCouple(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListCouples godoc
// @Summary List couples
// @Description List all couple profiles
// @Tags Wedding Couples
// @Produce json
// @Success 200 {array} CoupleResponse
// @Router /wedding/couples [get]
func (h Handler) ListCouples(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListCouples(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetCouple godoc
// @Summary Get a couple by ID
// @Tags Wedding Couples
// @Produce json
// @Param id path string true "Couple ID (UUID)"
// @Success 200 {object} CoupleResponse
// @Failure 404 {object} map[string]string "Couple not found"
// @Router /wedding/couples/{id} [get]
func (h Handler) GetCouple(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetCouple(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateCouple godoc
// @Summary Update a couple
// @Tags Wedding Couples
// @Accept json
// @Produce json
// @Param id path string true "Couple ID (UUID)"
// @Param request body UpdateCoupleRequest true "Update couple request"
// @Success 200 {object} CoupleResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Couple not found"
// @Router /wedding/couples/{id} [put]
func (h Handler) UpdateCouple(w http.ResponseWriter, r *http.Request) {
	var req UpdateCoupleRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateCouple(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteCouple godoc
// @Summary Delete a couple
// @Tags Wedding Couples
// @Param id path string true "Couple ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Couple not found"
// @Router /wedding/couples/{id} [delete]
func (h Handler) DeleteCouple(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteCouple(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "couple deleted"})
}

// --- Event Handlers ---

// CreateEvent godoc
// @Summary Create a wedding event
// @Description Create akad/resepsi event; setting is_main_event=true unsets others
// @Tags Wedding Events
// @Accept json
// @Produce json
// @Param request body CreateEventRequest true "Create event request"
// @Success 201 {object} EventResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/events [post]
func (h Handler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var req CreateEventRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateEvent(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListEvents godoc
// @Summary List wedding events
// @Tags Wedding Events
// @Produce json
// @Success 200 {array} EventResponse
// @Router /wedding/events [get]
func (h Handler) ListEvents(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListEvents(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetEvent godoc
// @Summary Get an event by ID
// @Tags Wedding Events
// @Produce json
// @Param id path string true "Event ID (UUID)"
// @Success 200 {object} EventResponse
// @Failure 404 {object} map[string]string "Event not found"
// @Router /wedding/events/{id} [get]
func (h Handler) GetEvent(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetEvent(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateEvent godoc
// @Summary Update a wedding event
// @Description Setting is_main_event=true unsets other main events
// @Tags Wedding Events
// @Accept json
// @Produce json
// @Param id path string true "Event ID (UUID)"
// @Param request body UpdateEventRequest true "Update event request"
// @Success 200 {object} EventResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Event not found"
// @Router /wedding/events/{id} [put]
func (h Handler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	var req UpdateEventRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateEvent(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteEvent godoc
// @Summary Delete a wedding event
// @Tags Wedding Events
// @Param id path string true "Event ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Event not found"
// @Router /wedding/events/{id} [delete]
func (h Handler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteEvent(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "event deleted"})
}

// --- Story Handlers ---

// CreateStory godoc
// @Summary Create a story timeline item
// @Tags Wedding Story
// @Accept json
// @Produce json
// @Param request body CreateStoryRequest true "Create story request"
// @Success 201 {object} StoryResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/story [post]
func (h Handler) CreateStory(w http.ResponseWriter, r *http.Request) {
	var req CreateStoryRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateStory(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListStories godoc
// @Summary List story timeline items
// @Tags Wedding Story
// @Produce json
// @Success 200 {array} StoryResponse
// @Router /wedding/story [get]
func (h Handler) ListStories(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListStories(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetStory godoc
// @Summary Get a story item by ID
// @Tags Wedding Story
// @Produce json
// @Param id path string true "Story ID (UUID)"
// @Success 200 {object} StoryResponse
// @Failure 404 {object} map[string]string "Story not found"
// @Router /wedding/story/{id} [get]
func (h Handler) GetStory(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetStory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateStory godoc
// @Summary Update a story item
// @Tags Wedding Story
// @Accept json
// @Produce json
// @Param id path string true "Story ID (UUID)"
// @Param request body UpdateStoryRequest true "Update story request"
// @Success 200 {object} StoryResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Story not found"
// @Router /wedding/story/{id} [put]
func (h Handler) UpdateStory(w http.ResponseWriter, r *http.Request) {
	var req UpdateStoryRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateStory(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteStory godoc
// @Summary Delete a story item
// @Tags Wedding Story
// @Param id path string true "Story ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Story not found"
// @Router /wedding/story/{id} [delete]
func (h Handler) DeleteStory(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteStory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "story deleted"})
}

// --- Gallery Handlers ---

// CreateGalleryItem godoc
// @Summary Add a gallery photo
// @Tags Wedding Gallery
// @Accept json
// @Produce json
// @Param request body CreateGalleryItemRequest true "Create gallery item request"
// @Success 201 {object} GalleryItemResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/gallery [post]
func (h Handler) CreateGalleryItem(w http.ResponseWriter, r *http.Request) {
	var req CreateGalleryItemRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateGalleryItem(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListGalleryItems godoc
// @Summary List gallery photos
// @Tags Wedding Gallery
// @Produce json
// @Success 200 {array} GalleryItemResponse
// @Router /wedding/gallery [get]
func (h Handler) ListGalleryItems(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListGalleryItems(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetGalleryItem godoc
// @Summary Get a gallery photo by ID
// @Tags Wedding Gallery
// @Produce json
// @Param id path string true "Gallery item ID (UUID)"
// @Success 200 {object} GalleryItemResponse
// @Failure 404 {object} map[string]string "Gallery item not found"
// @Router /wedding/gallery/{id} [get]
func (h Handler) GetGalleryItem(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetGalleryItem(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateGalleryItem godoc
// @Summary Update a gallery photo
// @Tags Wedding Gallery
// @Accept json
// @Produce json
// @Param id path string true "Gallery item ID (UUID)"
// @Param request body UpdateGalleryItemRequest true "Update gallery item request"
// @Success 200 {object} GalleryItemResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Gallery item not found"
// @Router /wedding/gallery/{id} [put]
func (h Handler) UpdateGalleryItem(w http.ResponseWriter, r *http.Request) {
	var req UpdateGalleryItemRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateGalleryItem(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteGalleryItem godoc
// @Summary Delete a gallery photo
// @Tags Wedding Gallery
// @Param id path string true "Gallery item ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Gallery item not found"
// @Router /wedding/gallery/{id} [delete]
func (h Handler) DeleteGalleryItem(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteGalleryItem(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "gallery item deleted"})
}

// --- FAQ Handlers ---

// CreateFaq godoc
// @Summary Create a FAQ entry
// @Tags Wedding FAQ
// @Accept json
// @Produce json
// @Param request body CreateFaqRequest true "Create faq request"
// @Success 201 {object} FaqResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/faqs [post]
func (h Handler) CreateFaq(w http.ResponseWriter, r *http.Request) {
	var req CreateFaqRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateFaq(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListFaqs godoc
// @Summary List FAQ entries
// @Tags Wedding FAQ
// @Produce json
// @Success 200 {array} FaqResponse
// @Router /wedding/faqs [get]
func (h Handler) ListFaqs(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListFaqs(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetFaq godoc
// @Summary Get a FAQ by ID
// @Tags Wedding FAQ
// @Produce json
// @Param id path string true "FAQ ID (UUID)"
// @Success 200 {object} FaqResponse
// @Failure 404 {object} map[string]string "FAQ not found"
// @Router /wedding/faqs/{id} [get]
func (h Handler) GetFaq(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetFaq(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateFaq godoc
// @Summary Update a FAQ
// @Tags Wedding FAQ
// @Accept json
// @Produce json
// @Param id path string true "FAQ ID (UUID)"
// @Param request body UpdateFaqRequest true "Update faq request"
// @Success 200 {object} FaqResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "FAQ not found"
// @Router /wedding/faqs/{id} [put]
func (h Handler) UpdateFaq(w http.ResponseWriter, r *http.Request) {
	var req UpdateFaqRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateFaq(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteFaq godoc
// @Summary Delete a FAQ
// @Tags Wedding FAQ
// @Param id path string true "FAQ ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "FAQ not found"
// @Router /wedding/faqs/{id} [delete]
func (h Handler) DeleteFaq(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteFaq(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "faq deleted"})
}

// --- Bank Account Handlers ---

// CreateBankAccount godoc
// @Summary Create a bank account for digital envelope
// @Tags Wedding Bank Accounts
// @Accept json
// @Produce json
// @Param request body CreateBankAccountRequest true "Create bank account request"
// @Success 201 {object} BankAccountResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/bank-accounts [post]
func (h Handler) CreateBankAccount(w http.ResponseWriter, r *http.Request) {
	var req CreateBankAccountRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateBankAccount(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListBankAccounts godoc
// @Summary List bank accounts
// @Tags Wedding Bank Accounts
// @Produce json
// @Success 200 {array} BankAccountResponse
// @Router /wedding/bank-accounts [get]
func (h Handler) ListBankAccounts(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListBankAccounts(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetBankAccount godoc
// @Summary Get a bank account by ID
// @Tags Wedding Bank Accounts
// @Produce json
// @Param id path string true "Bank account ID (UUID)"
// @Success 200 {object} BankAccountResponse
// @Failure 404 {object} map[string]string "Bank account not found"
// @Router /wedding/bank-accounts/{id} [get]
func (h Handler) GetBankAccount(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetBankAccount(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateBankAccount godoc
// @Summary Update a bank account
// @Tags Wedding Bank Accounts
// @Accept json
// @Produce json
// @Param id path string true "Bank account ID (UUID)"
// @Param request body UpdateBankAccountRequest true "Update bank account request"
// @Success 200 {object} BankAccountResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Bank account not found"
// @Router /wedding/bank-accounts/{id} [put]
func (h Handler) UpdateBankAccount(w http.ResponseWriter, r *http.Request) {
	var req UpdateBankAccountRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateBankAccount(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteBankAccount godoc
// @Summary Delete a bank account
// @Tags Wedding Bank Accounts
// @Param id path string true "Bank account ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Bank account not found"
// @Router /wedding/bank-accounts/{id} [delete]
func (h Handler) DeleteBankAccount(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteBankAccount(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "bank account deleted"})
}

// --- Ewallet Handlers ---

// CreateEwallet godoc
// @Summary Create an e-wallet account for digital envelope
// @Tags Wedding Ewallets
// @Accept json
// @Produce json
// @Param request body CreateEwalletRequest true "Create ewallet request"
// @Success 201 {object} EwalletResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/ewallets [post]
func (h Handler) CreateEwallet(w http.ResponseWriter, r *http.Request) {
	var req CreateEwalletRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateEwallet(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListEwallets godoc
// @Summary List e-wallet accounts
// @Tags Wedding Ewallets
// @Produce json
// @Success 200 {array} EwalletResponse
// @Router /wedding/ewallets [get]
func (h Handler) ListEwallets(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListEwallets(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetEwallet godoc
// @Summary Get an e-wallet by ID
// @Tags Wedding Ewallets
// @Produce json
// @Param id path string true "Ewallet ID (UUID)"
// @Success 200 {object} EwalletResponse
// @Failure 404 {object} map[string]string "Ewallet not found"
// @Router /wedding/ewallets/{id} [get]
func (h Handler) GetEwallet(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetEwallet(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateEwallet godoc
// @Summary Update an e-wallet
// @Tags Wedding Ewallets
// @Accept json
// @Produce json
// @Param id path string true "Ewallet ID (UUID)"
// @Param request body UpdateEwalletRequest true "Update ewallet request"
// @Success 200 {object} EwalletResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Ewallet not found"
// @Router /wedding/ewallets/{id} [put]
func (h Handler) UpdateEwallet(w http.ResponseWriter, r *http.Request) {
	var req UpdateEwalletRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateEwallet(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteEwallet godoc
// @Summary Delete an e-wallet
// @Tags Wedding Ewallets
// @Param id path string true "Ewallet ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Ewallet not found"
// @Router /wedding/ewallets/{id} [delete]
func (h Handler) DeleteEwallet(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteEwallet(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "ewallet deleted"})
}

// --- Wishlist Handlers ---

// CreateWishlistItem godoc
// @Summary Create a wishlist gift item
// @Tags Wedding Wishlist
// @Accept json
// @Produce json
// @Param request body CreateWishlistItemRequest true "Create wishlist item request"
// @Success 201 {object} WishlistItemResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /wedding/wishlist [post]
func (h Handler) CreateWishlistItem(w http.ResponseWriter, r *http.Request) {
	var req CreateWishlistItemRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateWishlistItem(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListWishlistItems godoc
// @Summary List wishlist gift items
// @Tags Wedding Wishlist
// @Produce json
// @Success 200 {array} WishlistItemResponse
// @Router /wedding/wishlist [get]
func (h Handler) ListWishlistItems(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListWishlistItems(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetWishlistItem godoc
// @Summary Get a wishlist item by ID
// @Tags Wedding Wishlist
// @Produce json
// @Param id path string true "Wishlist item ID (UUID)"
// @Success 200 {object} WishlistItemResponse
// @Failure 404 {object} map[string]string "Wishlist item not found"
// @Router /wedding/wishlist/{id} [get]
func (h Handler) GetWishlistItem(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetWishlistItem(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateWishlistItem godoc
// @Summary Update a wishlist item
// @Tags Wedding Wishlist
// @Accept json
// @Produce json
// @Param id path string true "Wishlist item ID (UUID)"
// @Param request body UpdateWishlistItemRequest true "Update wishlist item request"
// @Success 200 {object} WishlistItemResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Wishlist item not found"
// @Router /wedding/wishlist/{id} [put]
func (h Handler) UpdateWishlistItem(w http.ResponseWriter, r *http.Request) {
	var req UpdateWishlistItemRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateWishlistItem(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteWishlistItem godoc
// @Summary Delete a wishlist item
// @Tags Wedding Wishlist
// @Param id path string true "Wishlist item ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Wishlist item not found"
// @Router /wedding/wishlist/{id} [delete]
func (h Handler) DeleteWishlistItem(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteWishlistItem(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "wishlist item deleted"})
}

// --- Section Handlers ---

// CreateSection godoc
// @Summary Register an invitation section
// @Description Register a section key (e.g. cover, acara, galeri) with enabled flag and order
// @Tags Wedding Sections
// @Accept json
// @Produce json
// @Param request body CreateSectionRequest true "Create section request"
// @Success 201 {object} SectionResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 409 {object} map[string]string "Section key already exists"
// @Router /wedding/sections [post]
func (h Handler) CreateSection(w http.ResponseWriter, r *http.Request) {
	var req CreateSectionRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.CreateSection(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// ListSections godoc
// @Summary List invitation sections
// @Tags Wedding Sections
// @Produce json
// @Success 200 {array} SectionResponse
// @Router /wedding/sections [get]
func (h Handler) ListSections(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.ListSections(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// GetSection godoc
// @Summary Get a section by ID
// @Tags Wedding Sections
// @Produce json
// @Param id path string true "Section ID (UUID)"
// @Success 200 {object} SectionResponse
// @Failure 404 {object} map[string]string "Section not found"
// @Router /wedding/sections/{id} [get]
func (h Handler) GetSection(w http.ResponseWriter, r *http.Request) {
	res, statusCode, err := h.service.GetSection(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// UpdateSection godoc
// @Summary Toggle/reorder an invitation section
// @Tags Wedding Sections
// @Accept json
// @Produce json
// @Param id path string true "Section ID (UUID)"
// @Param request body UpdateSectionRequest true "Update section request"
// @Success 200 {object} SectionResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Section not found"
// @Router /wedding/sections/{id} [put]
func (h Handler) UpdateSection(w http.ResponseWriter, r *http.Request) {
	var req UpdateSectionRequest
	if !h.decodeJSON(w, r, &req) {
		return
	}

	res, statusCode, err := h.service.UpdateSection(r.Context(), chi.URLParam(r, "id"), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, res)
}

// DeleteSection godoc
// @Summary Delete an invitation section registration
// @Tags Wedding Sections
// @Param id path string true "Section ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string "Section not found"
// @Router /wedding/sections/{id} [delete]
func (h Handler) DeleteSection(w http.ResponseWriter, r *http.Request) {
	statusCode, err := h.service.DeleteSection(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}
	response.ResponseJSON(w, statusCode, map[string]string{"message": "section deleted"})
}
