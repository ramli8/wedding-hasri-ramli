package invitation

import (
	"encoding/json"
	"time"

	"github.com/base-go/backend/internal/shared/models"
)

// --- Wedding (singleton) DTOs ---

type UpdateWeddingRequest struct {
	GroomName           string         `json:"groom_name" validate:"required,min=1,max=255"`
	BrideName           string         `json:"bride_name" validate:"required,min=1,max=255"`
	WeddingDate         *time.Time     `json:"wedding_date"`
	Content             models.JSONMap `json:"content"`
	GiftShippingAddress *string        `json:"gift_shipping_address"`
}

type WeddingResponse struct {
	GroomName           string         `json:"groom_name"`
	BrideName           string         `json:"bride_name"`
	WeddingDate         *time.Time     `json:"wedding_date"`
	Content             models.JSONMap `json:"content"`
	GiftShippingAddress *string        `json:"gift_shipping_address"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
}

// --- Couple DTOs ---

type CreateCoupleRequest struct {
	Side            string  `json:"side" validate:"required,oneof=pria wanita"`
	FullName        string  `json:"full_name" validate:"required,min=1,max=255"`
	Gelar           *string `json:"gelar" validate:"omitempty,max=100"`
	PhotoURL        *string `json:"photo_url"`
	InstagramHandle *string `json:"instagram_handle" validate:"omitempty,max=50"`
}

type UpdateCoupleRequest struct {
	Side            string  `json:"side" validate:"omitempty,oneof=pria wanita"`
	FullName        *string `json:"full_name" validate:"omitempty,min=1,max=255"`
	Gelar           *string `json:"gelar" validate:"omitempty,max=100"`
	PhotoURL        *string `json:"photo_url"`
	InstagramHandle *string `json:"instagram_handle" validate:"omitempty,max=50"`
}

type CoupleResponse struct {
	ID              string    `json:"id"`
	Side            string    `json:"side"`
	FullName        string    `json:"full_name"`
	Gelar           *string   `json:"gelar"`
	PhotoURL        *string   `json:"photo_url"`
	InstagramHandle *string   `json:"instagram_handle"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// --- Event DTOs ---

type CreateEventRequest struct {
	Name        string     `json:"name" validate:"required,min=1,max=255"`
	EventDate   *time.Time `json:"event_date"`
	StartTime   *time.Time `json:"start_time"`
	VenueName   *string    `json:"venue_name" validate:"omitempty,max=255"`
	AddressFull *string    `json:"address_full"`
	GmapsURL    *string    `json:"gmaps_url"`
	Notes       *string    `json:"notes"`
	IsMainEvent bool       `json:"is_main_event"`
	OrderIndex  int        `json:"order_index"`
}

type UpdateEventRequest struct {
	Name        *string    `json:"name" validate:"omitempty,min=1,max=255"`
	EventDate   *time.Time `json:"event_date"`
	StartTime   *time.Time `json:"start_time"`
	VenueName   *string    `json:"venue_name" validate:"omitempty,max=255"`
	AddressFull *string    `json:"address_full"`
	GmapsURL    *string    `json:"gmaps_url"`
	Notes       *string    `json:"notes"`
	IsMainEvent *bool      `json:"is_main_event"`
	OrderIndex  *int       `json:"order_index"`
}

type EventResponse struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	EventDate   *time.Time `json:"event_date"`
	StartTime   *time.Time `json:"start_time"`
	VenueName   *string    `json:"venue_name"`
	AddressFull *string    `json:"address_full"`
	GmapsURL    *string    `json:"gmaps_url"`
	Notes       *string    `json:"notes"`
	IsMainEvent bool       `json:"is_main_event"`
	OrderIndex  int        `json:"order_index"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// --- Story DTOs ---

type CreateStoryRequest struct {
	EventDate   *string `json:"event_date" validate:"omitempty,max=50"`
	Title       string  `json:"title" validate:"required,min=1,max=255"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
	OrderIndex  int     `json:"order_index"`
}

type UpdateStoryRequest struct {
	EventDate   *string `json:"event_date" validate:"omitempty,max=50"`
	Title       *string `json:"title" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
	OrderIndex  *int    `json:"order_index"`
}

type StoryResponse struct {
	ID          string    `json:"id"`
	EventDate   *string   `json:"event_date"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	ImageURL    *string   `json:"image_url"`
	OrderIndex  int       `json:"order_index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// --- Gallery DTOs ---

type CreateGalleryItemRequest struct {
	ImageURL   string  `json:"image_url" validate:"required,max=1000"`
	Caption    *string `json:"caption" validate:"omitempty,max=500"`
	OrderIndex int     `json:"order_index"`
}

type UpdateGalleryItemRequest struct {
	ImageURL   *string `json:"image_url" validate:"omitempty,max=1000"`
	Caption    *string `json:"caption" validate:"omitempty,max=500"`
	OrderIndex *int    `json:"order_index"`
}

type GalleryItemResponse struct {
	ID         string    `json:"id"`
	ImageURL   string    `json:"image_url"`
	Caption    *string   `json:"caption"`
	OrderIndex int       `json:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// --- FAQ DTOs ---

type CreateFaqRequest struct {
	Question   string `json:"question" validate:"required,min=1"`
	Answer     string `json:"answer" validate:"required,min=1"`
	OrderIndex int    `json:"order_index"`
}

type UpdateFaqRequest struct {
	Question   *string `json:"question" validate:"omitempty,min=1"`
	Answer     *string `json:"answer" validate:"omitempty,min=1"`
	OrderIndex *int    `json:"order_index"`
}

type FaqResponse struct {
	ID         string    `json:"id"`
	Question   string    `json:"question"`
	Answer     string    `json:"answer"`
	OrderIndex int       `json:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// --- Bank Account DTOs ---

type CreateBankAccountRequest struct {
	BankName          string `json:"bank_name" validate:"required,min=1,max=100"`
	AccountNumber     string `json:"account_number" validate:"required,min=1,max=100"`
	AccountHolderName string `json:"account_holder_name" validate:"required,min=1,max=255"`
	IsActive          *bool  `json:"is_active"`
}

type UpdateBankAccountRequest struct {
	BankName          *string `json:"bank_name" validate:"omitempty,min=1,max=100"`
	AccountNumber     *string `json:"account_number" validate:"omitempty,min=1,max=100"`
	AccountHolderName *string `json:"account_holder_name" validate:"omitempty,min=1,max=255"`
	IsActive          *bool   `json:"is_active"`
}

type BankAccountResponse struct {
	ID                string    `json:"id"`
	BankName          string    `json:"bank_name"`
	AccountNumber     string    `json:"account_number"`
	AccountHolderName string    `json:"account_holder_name"`
	IsActive          bool      `json:"is_active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// --- Ewallet DTOs ---

type CreateEwalletRequest struct {
	ProviderName   string  `json:"provider_name" validate:"required,min=1,max=100"`
	AccountID      string  `json:"account_id" validate:"required,min=1,max=255"`
	QrCodeImageURL *string `json:"qr_code_image_url"`
	IsActive       *bool   `json:"is_active"`
}

type UpdateEwalletRequest struct {
	ProviderName   *string `json:"provider_name" validate:"omitempty,min=1,max=100"`
	AccountID      *string `json:"account_id" validate:"omitempty,min=1,max=255"`
	QrCodeImageURL *string `json:"qr_code_image_url"`
	IsActive       *bool   `json:"is_active"`
}

type EwalletResponse struct {
	ID             string    `json:"id"`
	ProviderName   string    `json:"provider_name"`
	AccountID      string    `json:"account_id"`
	QrCodeImageURL *string   `json:"qr_code_image_url"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// --- Wishlist DTOs ---

type CreateWishlistItemRequest struct {
	ItemName     string  `json:"item_name" validate:"required,min=1,max=255"`
	ItemImageURL *string `json:"item_image_url"`
	ItemLink     *string `json:"item_link"`
}

type UpdateWishlistItemRequest struct {
	ItemName     *string `json:"item_name" validate:"omitempty,min=1,max=255"`
	ItemImageURL *string `json:"item_image_url"`
	ItemLink     *string `json:"item_link"`
}

type WishlistItemResponse struct {
	ID           string     `json:"id"`
	ItemName     string     `json:"item_name"`
	ItemImageURL *string    `json:"item_image_url"`
	ItemLink     *string    `json:"item_link"`
	IsClaimed    bool       `json:"is_claimed"`
	ClaimedAt    *time.Time `json:"claimed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// --- Section DTOs ---

type CreateSectionRequest struct {
	SectionKey string `json:"section_key" validate:"required,min=1,max=50"`
	IsEnabled  *bool  `json:"is_enabled"`
	OrderIndex int    `json:"order_index"`
}

type UpdateSectionRequest struct {
	IsEnabled  *bool `json:"is_enabled"`
	OrderIndex *int  `json:"order_index"`
}

type SectionResponse struct {
	ID         string    `json:"id"`
	SectionKey string    `json:"section_key"`
	IsEnabled  bool      `json:"is_enabled"`
	OrderIndex int       `json:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// --- Public invitation payload DTOs ---

type CoverContent struct {
	Photos     []string `json:"photos"`
	ButtonText string   `json:"button_text"`
}

type MusicContent struct {
	FileURL *string `json:"file_url"`
}

type OpeningContent struct {
	Eyebrow     *string `json:"eyebrow"`
	Arabic      *string `json:"arabic"`
	Translation *string `json:"translation"`
	Source      *string `json:"source"`
	Greeting    *string `json:"greeting"`
}

type DressCodeContent struct {
	Description  *string  `json:"description"`
	ColorPalette []string `json:"color_palette"`
	ImageURL     *string  `json:"image_url"`
}

type LivestreamContent struct {
	Platform *string    `json:"platform"`
	URL      *string    `json:"url"`
	Datetime *time.Time `json:"datetime"`
	Notes    *string    `json:"notes"`
}

type FooterContent struct {
	ThankYouMessage *string             `json:"thank_you_message"`
	MadeByCredit    *string             `json:"made_by_credit"`
	SocialLinks     []map[string]string `json:"social_links"`
}

type WeddingContent struct {
	Cover      CoverContent      `json:"cover"`
	Music      MusicContent      `json:"music"`
	Opening    OpeningContent    `json:"opening"`
	DressCode  DressCodeContent  `json:"dress_code"`
	Livestream LivestreamContent `json:"livestream"`
	Footer     FooterContent     `json:"footer"`
}

func ParseWeddingContent(raw models.JSONMap) WeddingContent {
	content := WeddingContent{
		Cover:     CoverContent{ButtonText: "Buka Undangan"},
		Music:     MusicContent{},
		Opening:   OpeningContent{},
		DressCode: DressCodeContent{ColorPalette: []string{}},
		Livestream: LivestreamContent{},
		Footer:    FooterContent{SocialLinks: []map[string]string{}},
	}
	if raw == nil {
		return content
	}
	b, err := json.Marshal(raw)
	if err != nil {
		return content
	}
	_ = json.Unmarshal(b, &content)
	if content.Cover.Photos == nil {
		content.Cover.Photos = []string{}
	}
	if content.Cover.ButtonText == "" {
		content.Cover.ButtonText = "Buka Undangan"
	}
	if content.DressCode.ColorPalette == nil {
		content.DressCode.ColorPalette = []string{}
	}
	if content.Footer.SocialLinks == nil {
		content.Footer.SocialLinks = []map[string]string{}
	}
	return content
}

type PublicWedding struct {
	GroomName           string         `json:"groom_name"`
	BrideName           string         `json:"bride_name"`
	WeddingDate         *time.Time     `json:"wedding_date"`
	Content             WeddingContent `json:"content"`
	GiftShippingAddress *string        `json:"gift_shipping_address"`
}

type PublicCouple struct {
	Side            string  `json:"side"`
	FullName        string  `json:"full_name"`
	Gelar           *string `json:"gelar"`
	PhotoURL        *string `json:"photo_url"`
	InstagramHandle *string `json:"instagram_handle"`
}

type PublicEvent struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	EventDate   *time.Time `json:"event_date"`
	StartTime   *time.Time `json:"start_time"`
	VenueName   *string    `json:"venue_name"`
	AddressFull *string    `json:"address_full"`
	GmapsURL    *string    `json:"gmaps_url"`
	Notes       *string    `json:"notes"`
	IsMainEvent bool       `json:"is_main_event"`
}

type PublicStory struct {
	EventDate   *string `json:"event_date"`
	Title       string  `json:"title"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
}

type PublicGalleryItem struct {
	ImageURL string  `json:"image_url"`
	Caption  *string `json:"caption"`
}

type PublicFaq struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

type PublicBankAccount struct {
	BankName          string `json:"bank_name"`
	AccountNumber     string `json:"account_number"`
	AccountHolderName string `json:"account_holder_name"`
}

type PublicEwallet struct {
	ProviderName   string  `json:"provider_name"`
	AccountID      string  `json:"account_id"`
	QrCodeImageURL *string `json:"qr_code_image_url"`
}

type PublicWishlistItem struct {
	ItemName     string  `json:"item_name"`
	ItemImageURL *string `json:"item_image_url"`
	ItemLink     *string `json:"item_link"`
	IsClaimed    bool    `json:"is_claimed"`
}

type PublicSection struct {
	SectionKey string `json:"section_key"`
	OrderIndex int    `json:"order_index"`
}

type PublicGuestInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	QRCode   string `json:"qr_code"`
	Category string `json:"category"`
}

type InvitationResponse struct {
	Wedding             PublicWedding        `json:"wedding"`
	Couples            []PublicCouple       `json:"couples"`
	Events              []PublicEvent        `json:"events"`
	Story               []PublicStory        `json:"story"`
	Gallery             []PublicGalleryItem  `json:"gallery"`
	Faqs                []PublicFaq          `json:"faqs"`
	BankAccounts        []PublicBankAccount  `json:"bank_accounts"`
	Ewallets            []PublicEwallet      `json:"ewallets"`
	Wishlist            []PublicWishlistItem `json:"wishlist"`
	Sections            []PublicSection      `json:"sections"`
	CountdownTarget     *time.Time           `json:"countdown_target"`
	Guest               *PublicGuestInfo     `json:"guest"`
}

// --- Public RSVP DTOs ---

type CreateRSVPRequest struct {
	GuestID          string  `json:"guest_id" validate:"required,uuid"`
	AttendanceStatus string  `json:"attendance_status" validate:"required,oneof=hadir tidak_hadir ragu"`
	NumberOfGuests   int     `json:"number_of_guests" validate:"required,min=1,max=20"`
	WeddingEventID   *string `json:"wedding_event_id" validate:"omitempty,uuid"`
}

type PublicRSVPResponse struct {
	ID               string    `json:"id"`
	GuestID          string    `json:"guest_id"`
	WeddingEventID   *string   `json:"wedding_event_id"`
	AttendanceStatus string    `json:"attendance_status"`
	NumberOfGuests   int       `json:"number_of_guests"`
	SubmittedAt      time.Time `json:"submitted_at"`
}

// --- Public Guestbook (ucapan) DTOs ---

type CreateGuestbookRequest struct {
	GuestID     *string `json:"guest_id" validate:"omitempty,uuid"`
	GuestName   string  `json:"guest_name" validate:"required,min=1,max=255"`
	MessageText string  `json:"message_text" validate:"required,min=1,max=2000"`
}

type PublicGuestbookEntry struct {
	ID          string    `json:"id"`
	GuestName   string    `json:"guest_name"`
	MessageText string    `json:"message_text"`
	ReplyText   *string   `json:"reply_text"`
	CreatedAt   time.Time `json:"created_at"`
}

type PublicGuestbookResponse struct {
	Entries []PublicGuestbookEntry `json:"entries"`
	Total   int64                  `json:"total"`
}
