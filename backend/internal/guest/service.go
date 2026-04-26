package guest

import (
	"bytes"
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math"
	"math/big"
	"net/http"
	"strings"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/validator"
	"github.com/xuri/excelize/v2"
)

type Service interface {
	// Guest operations
	CreateGuest(ctx context.Context, req CreateGuestRequest) (GuestResponse, int, error)
	GetGuestByID(ctx context.Context, id string) (GuestResponse, int, error)
	ListGuests(ctx context.Context, req GuestListRequest) (GuestListResponse, int, error)
	UpdateGuest(ctx context.Context, id string, req UpdateGuestRequest) (GuestResponse, int, error)
	DeleteGuest(ctx context.Context, id string) (int, error)
	RestoreGuest(ctx context.Context, id string) (int, error)
	ListDeletedGuests(ctx context.Context, req GuestListRequest) (GuestListResponse, int, error)
	UpdateStatusSent(ctx context.Context, id string, status string) (int, error)

	// Guest Category operations
	CreateCategory(ctx context.Context, req CreateGuestCategoryRequest) (*GuestCategoryResponse, int, error)
	GetCategoryByID(ctx context.Context, id int) (*GuestCategoryResponse, int, error)
	ListCategories(ctx context.Context, req GuestCategoryListRequest) (*GuestCategoryListResponse, int, error)
	UpdateCategory(ctx context.Context, id int, req UpdateGuestCategoryRequest) (*GuestCategoryResponse, int, error)
	DeleteCategory(ctx context.Context, id int) (int, error)

	// Excel operations
	ExportGuests(ctx context.Context) ([]byte, error)
	GetImportTemplate(ctx context.Context) ([]byte, error)
	PreviewImport(ctx context.Context, fileContent []byte) (GuestImportPreviewResponse, int, error)
	ExecuteImport(ctx context.Context, rows []CreateGuestRequest) (int, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

// --- Guest Operations ---

func (s *service) CreateGuest(ctx context.Context, req CreateGuestRequest) (GuestResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return GuestResponse{}, http.StatusBadRequest, err
	}

	// Validation: either phone or instagram must be filled
	if (req.PhoneNumber == nil || *req.PhoneNumber == "") && (req.InstagramUsername == nil || *req.InstagramUsername == "") {
		return GuestResponse{}, http.StatusBadRequest, errors.New("at least one of phone number or instagram username must be filled")
	}

	qrCode, err := s.generateUniqueQRCode(ctx)
	if err != nil {
		return GuestResponse{}, http.StatusInternalServerError, err
	}

	guest := &models.Guest{
		GuestCategoryID:   req.GuestCategoryID,
		QRCode:            qrCode,
		Name:              req.Name,
		PhoneNumber:       req.PhoneNumber,
		InstagramUsername: req.InstagramUsername,
		Address:           req.Address,
		Note:              req.Note,
		StatusAttending:   "pending",
		StatusSent:        "pending",
	}

	if err := s.repo.Create(ctx, guest); err != nil {
		return GuestResponse{}, http.StatusInternalServerError, err
	}

	// Fetch again to get category info
	createdGuest, err := s.repo.GetByID(ctx, guest.ID)
	if err != nil {
		return s.mapToResponse(*guest), http.StatusCreated, nil
	}

	return s.mapToResponse(*createdGuest), http.StatusCreated, nil
}

func (s *service) GetGuestByID(ctx context.Context, id string) (GuestResponse, int, error) {
	guest, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return GuestResponse{}, http.StatusNotFound, ErrGuestNotFound
	}

	return s.mapToResponse(*guest), http.StatusOK, nil
}

func (s *service) ListGuests(ctx context.Context, req GuestListRequest) (GuestListResponse, int, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	guests, total, err := s.repo.List(ctx, req)
	if err != nil {
		return GuestListResponse{}, http.StatusInternalServerError, err
	}

	items := make([]GuestResponse, len(guests))
	for i, g := range guests {
		items[i] = s.mapToResponse(g)
	}

	totalPages := int(math.Ceil(float64(total) / float64(req.PageSize)))

	return GuestListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, http.StatusOK, nil
}

func (s *service) UpdateGuest(ctx context.Context, id string, req UpdateGuestRequest) (GuestResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return GuestResponse{}, http.StatusBadRequest, err
	}

	guest, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return GuestResponse{}, http.StatusNotFound, ErrGuestNotFound
	}

	if req.GuestCategoryID != 0 {
		guest.GuestCategoryID = req.GuestCategoryID
	}
	if req.Name != "" {
		guest.Name = req.Name
	}
	if req.PhoneNumber != nil {
		guest.PhoneNumber = req.PhoneNumber
	}
	if req.InstagramUsername != nil {
		guest.InstagramUsername = req.InstagramUsername
	}
	if req.Address != nil {
		guest.Address = req.Address
	}
	if req.Note != nil {
		guest.Note = req.Note
	}

	// Validation: either phone or instagram must be filled
	if (guest.PhoneNumber == nil || *guest.PhoneNumber == "") && (guest.InstagramUsername == nil || *guest.InstagramUsername == "") {
		return GuestResponse{}, http.StatusBadRequest, errors.New("at least one of phone number or instagram username must be filled")
	}

	if err := s.repo.Update(ctx, guest); err != nil {
		return GuestResponse{}, http.StatusInternalServerError, err
	}

	// Fetch again for latest category info
	updatedGuest, _ := s.repo.GetByID(ctx, id)
	return s.mapToResponse(*updatedGuest), http.StatusOK, nil
}

func (s *service) DeleteGuest(ctx context.Context, id string) (int, error) {
	if _, err := s.repo.GetByID(ctx, id); err != nil {
		return http.StatusNotFound, ErrGuestNotFound
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (s *service) RestoreGuest(ctx context.Context, id string) (int, error) {
	if err := s.repo.Restore(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) ListDeletedGuests(ctx context.Context, req GuestListRequest) (GuestListResponse, int, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	guests, total, err := s.repo.ListDeleted(ctx, req)
	if err != nil {
		return GuestListResponse{}, http.StatusInternalServerError, err
	}

	items := make([]GuestResponse, len(guests))
	for i, g := range guests {
		items[i] = s.mapToResponse(g)
	}

	totalPages := int(math.Ceil(float64(total) / float64(req.PageSize)))

	return GuestListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, http.StatusOK, nil
}

// --- Guest Category Operations ---

func (s *service) UpdateStatusSent(ctx context.Context, id string, status string) (int, error) {
	if err := s.repo.UpdateStatusSent(ctx, id, status); err != nil {
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func (s *service) CreateCategory(ctx context.Context, req CreateGuestCategoryRequest) (*GuestCategoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return nil, http.StatusBadRequest, err
	}

	category := &models.GuestCategory{
		Name:      req.Name,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
	}

	if err := s.repo.CreateCategory(ctx, category); err != nil {
		if err == ErrCategoryAlreadyExists {
			return nil, http.StatusConflict, err
		}
		return nil, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusCreated, nil
}

func (s *service) GetCategoryByID(ctx context.Context, id int) (*GuestCategoryResponse, int, error) {
	category, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusOK, nil
}

func (s *service) ListCategories(ctx context.Context, req GuestCategoryListRequest) (*GuestCategoryListResponse, int, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 10
	}

	categories, total, err := s.repo.GetAllCategories(ctx, req)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	items := make([]GuestCategoryResponse, len(categories))
	for i, category := range categories {
		items[i] = *s.mapCategoryToResponse(&category)
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	return &GuestCategoryListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, http.StatusOK, nil
}

func (s *service) UpdateCategory(ctx context.Context, id int, req UpdateGuestCategoryRequest) (*GuestCategoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return nil, http.StatusBadRequest, err
	}

	category, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}

	if req.Name != "" {
		category.Name = req.Name
	}

	category.StartTime = req.StartTime
	category.EndTime = req.EndTime

	if err := s.repo.UpdateCategory(ctx, category); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusOK, nil
}

func (s *service) DeleteCategory(ctx context.Context, id int) (int, error) {
	if _, err := s.repo.GetCategoryByID(ctx, id); err != nil {
		if err == ErrCategoryNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}

	if err := s.repo.DeleteCategory(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

// --- Internal Helpers ---

func (s *service) generateUniqueQRCode(ctx context.Context) (string, error) {
	for i := 0; i < 10; i++ { // try 10 times
		code, err := s.generateRandomString(6)
		if err != nil {
			return "", err
		}

		exists, err := s.repo.IsQRCodeExists(ctx, code)
		if err != nil {
			return "", err
		}

		if !exists {
			return code, nil
		}
	}
	return "", errors.New("failed to generate unique QR code")
}

func (s *service) generateRandomString(n int) (string, error) {
	const letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	ret := make([]byte, n)
	for i := 0; i < n; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		if err != nil {
			return "", err
		}
		ret[i] = letters[num.Int64()]
	}
	return string(ret), nil
}

func (s *service) mapToResponse(g models.Guest) GuestResponse {
	return GuestResponse{
		ID:                g.ID,
		GuestCategoryID:   g.GuestCategoryID,
		CategoryName:      g.GuestCategory.Name,
		QRCode:            g.QRCode,
		Name:              g.Name,
		PhoneNumber:       g.PhoneNumber,
		InstagramUsername: g.InstagramUsername,
		Address:           g.Address,
		Note:              g.Note,
		StatusAttending:   g.StatusAttending,
		StatusSent:        g.StatusSent,
		CheckInAt:         g.CheckInAt,
		CheckOutAt:        g.CheckOutAt,
		CreatedAt:         g.CreatedAt,
		UpdatedAt:         g.UpdatedAt,
	}
}

func (s *service) mapCategoryToResponse(category *models.GuestCategory) *GuestCategoryResponse {
	return &GuestCategoryResponse{
		ID:        category.ID,
		Name:      category.Name,
		StartTime: category.StartTime,
		EndTime:   category.EndTime,
		CreatedAt: category.CreatedAt,
		UpdatedAt: category.UpdatedAt,
	}
}
func (s *service) ListAllCategories(ctx context.Context) ([]models.GuestCategory, error) {
	return s.repo.ListAllCategories(ctx)
}

// --- Excel Operations ---

func (s *service) ExportGuests(ctx context.Context) ([]byte, error) {
	guests, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Guests"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"Name", "Category", "Phone Number", "Instagram", "Address", "Note", "RSVP Status", "Invitation Status", "QR Code", "Check-in At"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	for i, g := range guests {
		rowIdx := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", rowIdx), g.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", rowIdx), g.GuestCategory.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", rowIdx), getStringValue(g.PhoneNumber))
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", rowIdx), getStringValue(g.InstagramUsername))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", rowIdx), getStringValue(g.Address))
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", rowIdx), getStringValue(g.Note))
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", rowIdx), g.StatusAttending)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", rowIdx), g.StatusSent)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", rowIdx), g.QRCode)
		if g.CheckInAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("J%d", rowIdx), g.CheckInAt.Format("2006-01-02 15:04:05"))
		}
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (s *service) GetImportTemplate(ctx context.Context) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Template"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"name", "category", "phone_number", "instagram_username", "address", "note"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	// Add dummy data based on existing categories
	categories, _ := s.repo.ListAllCategories(ctx)
	for i, cat := range categories {
		rowIdx := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", rowIdx), fmt.Sprintf("Contoh Tamu %s", cat.Name))
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", rowIdx), cat.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", rowIdx), "08123456789")
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", rowIdx), "dummy_ig")
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", rowIdx), "Alamat Dummy")
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", rowIdx), "Catatan dummy")
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (s *service) PreviewImport(ctx context.Context, fileContent []byte) (GuestImportPreviewResponse, int, error) {
	f, err := excelize.OpenReader(bytes.NewReader(fileContent))
	if err != nil {
		return GuestImportPreviewResponse{}, http.StatusBadRequest, err
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return GuestImportPreviewResponse{}, http.StatusBadRequest, err
	}

	if len(rows) < 1 {
		return GuestImportPreviewResponse{}, http.StatusBadRequest, errors.New("excel file is empty")
	}

	// Map categories for lookup (Name -> ID)
	categories, _ := s.repo.ListAllCategories(ctx)
	catNameToId := make(map[string]int)
	for _, cat := range categories {
		catNameToId[cat.Name] = cat.ID
	}

	var items []GuestImportRow
	validCount := 0
	errorCount := 0

	// Assume first row is header
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		if len(row) == 0 {
			continue
		}

		importRow := GuestImportRow{
			IsValid: true,
			Errors:  []string{},
		}

		// Fill data (handling varying row lengths)
		if len(row) > 0 {
			importRow.Name = row[0]
		}
		if len(row) > 1 {
			catName := row[1]
			importRow.CategoryName = catName
			if id, ok := catNameToId[catName]; ok {
				importRow.GuestCategoryID = id
			}
		}
		if len(row) > 2 {
			val := row[2]
			if val != "" {
				phone := val
				phone = strings.ReplaceAll(phone, " ", "")
				phone = strings.ReplaceAll(phone, "-", "")
				phone = strings.ReplaceAll(phone, "+", "")
				if strings.HasPrefix(phone, "0") {
					phone = "62" + strings.TrimPrefix(phone, "0")
				} else if !strings.HasPrefix(phone, "62") {
					phone = "62" + phone
				}
				importRow.PhoneNumber = &phone
			} else {
				importRow.PhoneNumber = nil
			}
		}
		if len(row) > 3 {
			val := row[3]
			importRow.InstagramUsername = &val
		}
		if len(row) > 4 {
			val := row[4]
			importRow.Address = &val
		}
		if len(row) > 5 {
			val := row[5]
			importRow.Note = &val
		}

		// Validations
		if importRow.Name == "" {
			importRow.IsValid = false
			importRow.Errors = append(importRow.Errors, "Name is required")
		}
		if importRow.GuestCategoryID == 0 {
			importRow.IsValid = false
			importRow.Errors = append(importRow.Errors, fmt.Sprintf("Category '%s' not found", importRow.CategoryName))
		}
		if (importRow.PhoneNumber == nil || *importRow.PhoneNumber == "") && (importRow.InstagramUsername == nil || *importRow.InstagramUsername == "") {
			importRow.IsValid = false
			importRow.Errors = append(importRow.Errors, "Either Phone Number or Instagram Username must be filled")
		}

		if importRow.IsValid {
			validCount++
		} else {
			errorCount++
		}
		items = append(items, importRow)
	}

	return GuestImportPreviewResponse{
		Items:      items,
		Total:      len(items),
		ValidCount: validCount,
		ErrorCount: errorCount,
	}, http.StatusOK, nil
}

func (s *service) ExecuteImport(ctx context.Context, rows []CreateGuestRequest) (int, error) {
	for _, row := range rows {
		_, statusCode, err := s.CreateGuest(ctx, row)
		if err != nil {
			return statusCode, err
		}
	}
	return http.StatusOK, nil
}

func getStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
